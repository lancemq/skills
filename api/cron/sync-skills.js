import { list, put } from "@vercel/blob";

const SOURCES = [
  {
    name: "VoltAgent/awesome-openclaw-skills",
    type: "directory",
    description: "OpenClaw community skills list.",
    source_url: "https://github.com/VoltAgent/awesome-openclaw-skills",
    readme_url:
      "https://raw.githubusercontent.com/VoltAgent/awesome-openclaw-skills/main/README.md",
    platform: "Codex",
  },
  {
    name: "Jeffallan/claude-skills",
    type: "directory",
    description: "Curated Claude skills and workflows.",
    source_url: "https://github.com/Jeffallan/claude-skills",
    readme_url:
      "https://raw.githubusercontent.com/Jeffallan/claude-skills/main/README.md",
    platform: "Claude",
  },
  {
    name: "ComposioHQ/awesome-claude-skills",
    type: "directory",
    description: "Large curated Claude skills list and ecosystem links.",
    source_url: "https://github.com/ComposioHQ/awesome-claude-skills",
    readme_url:
      "https://raw.githubusercontent.com/ComposioHQ/awesome-claude-skills/master/README.md",
    platform: "Claude",
  },
  {
    name: "daymade/claude-code-skills",
    type: "directory",
    description: "Practical Claude Code skills repository.",
    source_url: "https://github.com/daymade/claude-code-skills",
    api_contents_url:
      "https://api.github.com/repos/daymade/claude-code-skills/contents",
    platform: "Claude Code",
  },
];

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization || "";
  return auth === `Bearer ${secret}`;
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=[\]{};:'",.<>/?\\|]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromUrl(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() || "skill";
    return seg
      .replace(/[-_]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((x) => x[0].toUpperCase() + x.slice(1))
      .join(" ");
  } catch {
    return "Skill";
  }
}

function nowIso() {
  return new Date().toISOString();
}

function toSkillRecord({ id, name, source, url, platform }, ts) {
  const short = `${name} skill from ${source.name}.`;
  const long = `Guides execution for ${name} workflows with reusable, structured instructions.`;
  return {
    id,
    name,
    name_zh: name,
    short_description: short,
    short_description_zh: short,
    long_description: long,
    long_description_zh: long,
    category: "Workflow",
    platforms: [platform],
    tags: ["skill", "automation"],
    popularity: 0,
    popularity_label: "Official/Curated",
    source_name: source.name,
    source_url: source.source_url,
    detail_url: url,
    link_status: "unknown",
    verified_at: "",
    created_at: ts,
    updated_at: ts,
  };
}

function parseMarkdownLinks(markdown) {
  const results = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = regex.exec(markdown)) !== null) {
    const label = (m[1] || "").trim();
    const url = (m[2] || "").trim();
    if (url) results.push({ label, url });
  }
  return results;
}

function looksLikeSkillUrl(url) {
  const lower = String(url).toLowerCase();
  return (
    (lower.includes("github.com") && lower.includes("/skill")) ||
    lower.includes("awesomeskill.ai/skill/")
  );
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "skills-cron-sync/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`fetch_failed:${response.status}:${url}`);
  return await response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "skills-cron-sync/1.0",
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`fetch_failed:${response.status}:${url}`);
  return await response.json();
}

async function collectFromReadme(source) {
  const markdown = await fetchText(source.readme_url);
  const rawLinks = parseMarkdownLinks(markdown).filter((x) => looksLikeSkillUrl(x.url));
  const unique = new Map();
  for (const item of rawLinks) {
    const url = item.url.replace(/\/+$/, "");
    if (unique.has(url)) continue;
    const rawName = item.label && item.label.length > 1 ? item.label : titleFromUrl(url);
    const id = slugify(rawName) || slugify(titleFromUrl(url));
    unique.set(url, {
      id,
      name: rawName,
      source,
      url,
      platform: source.platform,
    });
  }
  return Array.from(unique.values());
}

async function collectFromGitHubContents(source) {
  const rows = await fetchJson(source.api_contents_url);
  const skills = [];
  for (const row of rows || []) {
    if (!row || row.type !== "dir") continue;
    const name = row.name || "";
    if (!name || name.startsWith(".") || name === "assets") continue;
    const id = slugify(name);
    if (!id) continue;
    const url = `${source.source_url}/tree/main/${name}`;
    skills.push({ id, name: titleFromUrl(url), source, url, platform: source.platform });
  }
  return skills;
}

async function resolveBlobJson(prefix, latestPath, envUrlKey) {
  if (process.env[envUrlKey]) {
    const resp = await fetch(process.env[envUrlKey], { cache: "no-store" });
    if (resp.ok) return await resp.json();
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix });
    const latest = (blobs || []).find((b) => b.pathname === latestPath);
    if (latest?.url) {
      const resp = await fetch(latest.url, { cache: "no-store" });
      if (resp.ok) return await resp.json();
    }
  }
  return null;
}

async function loadExistingSkills() {
  const blobData = await resolveBlobJson("skills-data/", "skills-data/latest.json", "SKILLS_JSON_BLOB_URL");
  if (Array.isArray(blobData)) return blobData;
  const fallback = await fetch("https://www.ai-skills.xyz/data/skills.json", { cache: "no-store" });
  if (fallback.ok) {
    const data = await fallback.json();
    return Array.isArray(data) ? data : [];
  }
  return [];
}

async function loadExistingSourcesMeta() {
  const blobData = await resolveBlobJson("sources-data/", "sources-data/latest.json", "SOURCES_META_BLOB_URL");
  if (blobData && Array.isArray(blobData.sources)) return blobData;
  const fallback = await fetch("https://www.ai-skills.xyz/data/sources.json", { cache: "no-store" });
  if (fallback.ok) {
    const data = await fallback.json();
    return {
      last_updated: data?.last_updated || "",
      sources: Array.isArray(data?.sources) ? data.sources : [],
    };
  }
  return { last_updated: "", sources: [] };
}

async function checkLinkStatus(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    if (response.ok) return "ok";
  } catch (_error) {}

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    return response.ok ? "ok" : "bad";
  } catch (_error) {
    return "bad";
  }
}

async function verifyCollectedLinks(collected) {
  const results = new Map();
  const maxChecks = Number(process.env.CRON_LINK_CHECK_LIMIT || 250);
  const concurrency = Number(process.env.CRON_LINK_CHECK_CONCURRENCY || 8);
  const targets = collected.slice(0, maxChecks);

  let index = 0;
  async function worker() {
    while (index < targets.length) {
      const i = index;
      index += 1;
      const item = targets[i];
      const status = await checkLinkStatus(item.url);
      results.set(`${item.source.name}::${item.id}`, { status, verified_at: nowIso() });
    }
  }

  const jobs = [];
  for (let i = 0; i < Math.max(1, concurrency); i += 1) jobs.push(worker());
  await Promise.all(jobs);
  return { results, checked: targets.length };
}

function mergeSkills(existing, collected, linkChecks) {
  const byKey = new Map();
  for (const skill of existing) {
    byKey.set(`${skill.source_name}::${skill.id}`, { ...skill });
  }

  let created = 0;
  let updated = 0;

  for (const item of collected) {
    const key = `${item.source.name}::${item.id}`;
    const prev = byKey.get(key);
    const check = linkChecks.get(key);

    if (!prev) {
      const record = toSkillRecord(item, nowIso());
      if (check) {
        record.link_status = check.status;
        record.verified_at = check.verified_at;
      }
      byKey.set(key, record);
      created += 1;
      continue;
    }

    const next = { ...prev };
    let changed = false;

    if (prev.detail_url !== item.url) {
      next.detail_url = item.url;
      changed = true;
    }
    if (!prev.name && item.name) {
      next.name = item.name;
      changed = true;
    }
    if (!Array.isArray(prev.platforms) || prev.platforms.length === 0) {
      next.platforms = [item.platform];
      changed = true;
    }
    if (!next.created_at) {
      next.created_at = nowIso();
      changed = true;
    }
    if (check) {
      if (next.link_status !== check.status) {
        next.link_status = check.status;
        changed = true;
      }
      next.verified_at = check.verified_at;
    }

    if (changed) {
      next.updated_at = nowIso();
      byKey.set(key, next);
      updated += 1;
    }
  }

  const merged = Array.from(byKey.values());
  merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return { merged, created, updated };
}

async function persistJson(pathPrefix, stablePath, payload) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { persisted: false, reason: "missing_blob_token" };
  }
  const buffer = Buffer.from(JSON.stringify(payload, null, 2) + "\n", "utf-8");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const versioned = await put(`${pathPrefix}-${stamp}.json`, buffer, {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json; charset=utf-8",
  });

  const latest = await put(stablePath, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json; charset=utf-8",
  });

  return { persisted: true, versioned: versioned.url, latest: latest.url };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const existing = await loadExistingSkills();
    const existingSourcesMeta = await loadExistingSourcesMeta();

    const collected = [];
    const sourceStats = [];
    for (const source of SOURCES) {
      try {
        const rows = source.readme_url
          ? await collectFromReadme(source)
          : await collectFromGitHubContents(source);
        collected.push(...rows);
        sourceStats.push({ source: source.name, ok: true, count: rows.length });
      } catch (error) {
        sourceStats.push({
          source: source.name,
          ok: false,
          error: error?.message || "source_sync_failed",
        });
      }
    }

    const linkCheck = await verifyCollectedLinks(collected);
    const { merged, created, updated } = mergeSkills(existing, collected, linkCheck.results);

    const today = new Date().toISOString().slice(0, 10);
    const sourceMap = new Map((existingSourcesMeta.sources || []).map((s) => [s.name, { ...s }]));
    for (const s of SOURCES) {
      if (!sourceMap.has(s.name)) {
        sourceMap.set(s.name, {
          name: s.name,
          type: s.type || "directory",
          description: s.description || "Curated skills source.",
          url: s.source_url,
        });
      }
    }
    const sourcesMeta = {
      last_updated: today,
      sources: Array.from(sourceMap.values()),
    };

    const persistSkills = await persistJson("skills-data/skills", "skills-data/latest.json", merged);
    const persistSources = await persistJson(
      "sources-data/sources",
      "sources-data/latest.json",
      sourcesMeta
    );

    return res.status(200).json({
      ok: true,
      now: nowIso(),
      existing_count: existing.length,
      discovered_count: collected.length,
      checked_links: linkCheck.checked,
      total_count: merged.length,
      created,
      updated,
      persist_skills: persistSkills,
      persist_sources: persistSources,
      sources: sourceStats,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "sync_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
