import { list, put } from "@vercel/blob";

export const BASE_SOURCES = [
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

const DISCOVERY_QUERIES = [
  "awesome claude skills",
  "awesome codex skills",
  "agent skills marketplace",
  "claude-code-skills",
  "openclaw skills",
];

export function nowIso() {
  return new Date().toISOString();
}

export function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization || "";
  return auth === `Bearer ${secret}`;
}

export function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=[\]{};:'",.<>/?\\|]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleFromUrl(url) {
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

function inferPlatform(text) {
  const s = String(text || "").toLowerCase();
  if (s.includes("codex") || s.includes("openai")) return "Codex";
  if (s.includes("claude code")) return "Claude Code";
  if (s.includes("claude")) return "Claude";
  return "AI";
}

function inferCategory(text) {
  const s = String(text || "").toLowerCase();
  if (/(api|backend|code|dev|test|program|build|deploy)/.test(s)) return "开发";
  if (/(design|ui|ux|figma|brand)/.test(s)) return "设计";
  if (/(seo|marketing|growth)/.test(s)) return "业务";
  if (/(security|audit|risk|scan)/.test(s)) return "安全";
  if (/(doc|pdf|ppt|xlsx|notion|write)/.test(s)) return "文档";
  if (/(research|analyze|insight)/.test(s)) return "研究";
  return "工作流";
}

function extractKeywords(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && w.length <= 18);
  return Array.from(new Set(words)).slice(0, 8);
}

export function toSkillRecord({ id, name, source, url, platform }, ts) {
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
    category: inferCategory(name),
    platforms: [platform],
    tags: ["skill", "automation"],
    popularity: 0,
    popularity_label: "Official/Curated",
    source_name: source.name,
    source_url: source.source_url,
    detail_url: url,
    link_status: "unknown",
    verified_at: "",
    is_active: true,
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

export async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "skills-cron-sync/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`fetch_failed:${response.status}:${url}`);
  return await response.text();
}

export async function fetchJson(url) {
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

export async function collectFromReadme(source) {
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
      platform: source.platform || inferPlatform(rawName),
    });
  }
  return Array.from(unique.values());
}

export async function collectFromGitHubContents(source) {
  const rows = await fetchJson(source.api_contents_url);
  const skills = [];
  for (const row of rows || []) {
    if (!row || row.type !== "dir") continue;
    const name = row.name || "";
    if (!name || name.startsWith(".") || name === "assets") continue;
    const id = slugify(name);
    if (!id) continue;
    const url = `${source.source_url}/tree/main/${name}`;
    skills.push({ id, name: titleFromUrl(url), source, url, platform: source.platform || inferPlatform(name) });
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

export async function loadExistingSkills() {
  const blobData = await resolveBlobJson("skills-data/", "skills-data/latest.json", "SKILLS_JSON_BLOB_URL");
  if (Array.isArray(blobData)) return blobData;
  const fallback = await fetch("https://www.ai-skills.xyz/data/skills.json", { cache: "no-store" });
  if (fallback.ok) {
    const data = await fallback.json();
    return Array.isArray(data) ? data : [];
  }
  return [];
}

export async function loadExistingSourcesMeta() {
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

export async function checkLinkStatus(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store",
    });
    if (response.ok) return "ok";
    if (response.status === 404 || response.status === 410) return "bad";
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

export async function verifyCollectedLinks(collected, limit = null) {
  const results = new Map();
  const maxChecks = Number(limit ?? process.env.CRON_LINK_CHECK_LIMIT ?? 250);
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

function stripHtml(s) {
  return String(s || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function enrichSkillFromPage(skill) {
  const url = skill.detail_url || skill.source_url;
  if (!url) return { changed: false };
  try {
    const html = await fetchText(url);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

    const pageTitle = stripHtml(titleMatch?.[1] || "");
    const pageDesc = stripHtml(descMatch?.[1] || "");
    const content = pageDesc || pageTitle;
    let changed = false;

    if ((!skill.short_description || skill.short_description.length < 8) && content) {
      skill.short_description = content.slice(0, 140);
      skill.short_description_zh = skill.short_description_zh || skill.short_description;
      changed = true;
    }
    if ((!skill.long_description || skill.long_description.length < 12) && content) {
      skill.long_description = content.slice(0, 300);
      skill.long_description_zh = skill.long_description_zh || skill.long_description;
      changed = true;
    }
    if ((!skill.category || skill.category === "") && content) {
      skill.category = inferCategory(content);
      changed = true;
    }
    if ((!Array.isArray(skill.tags) || skill.tags.length === 0) && content) {
      skill.tags = extractKeywords(content);
      changed = true;
    }
    if ((!skill.name || skill.name.length < 2) && pageTitle) {
      skill.name = pageTitle;
      skill.name_zh = skill.name_zh || pageTitle;
      changed = true;
    }

    return { changed };
  } catch (_error) {
    return { changed: false };
  }
}

export function mergeSkills(existing, collected, linkChecks) {
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
        record.is_active = check.status !== "bad";
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
      const active = check.status !== "bad";
      if (next.is_active !== active) {
        next.is_active = active;
        changed = true;
      }
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

export async function persistJson(pathPrefix, stablePath, payload) {
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

export async function discoverSourcesFromWeb(existingSources) {
  const sourceMap = new Map((existingSources || []).map((s) => [s.name, { ...s }]));

  for (const source of BASE_SOURCES) {
    if (!sourceMap.has(source.name)) sourceMap.set(source.name, { ...source, url: source.source_url });
  }

  for (const q of DISCOVERY_QUERIES) {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
        `${q} in:name,description`
      )}&sort=updated&order=desc&per_page=10`;
      const data = await fetchJson(url);
      for (const repo of data.items || []) {
        if (!repo || repo.fork || repo.archived) continue;
        const fullName = repo.full_name;
        if (!fullName) continue;
        const sourceName = fullName;
        if (sourceMap.has(sourceName)) continue;
        const defaultBranch = repo.default_branch || "main";
        sourceMap.set(sourceName, {
          name: sourceName,
          type: "directory",
          description: repo.description || "Discovered skills source.",
          url: repo.html_url,
          source_url: repo.html_url,
          readme_url: `https://raw.githubusercontent.com/${fullName}/${defaultBranch}/README.md`,
          platform: inferPlatform(`${repo.name} ${repo.description || ""}`),
        });
      }
    } catch (_error) {
      // ignore query failure
    }
  }

  return Array.from(sourceMap.values());
}

export async function collectSkillsFromSources(sources) {
  const collected = [];
  const sourceStats = [];

  for (const sourceRaw of sources) {
    const source = {
      ...sourceRaw,
      source_url: sourceRaw.source_url || sourceRaw.url,
      platform: sourceRaw.platform || inferPlatform(sourceRaw.name),
    };
    try {
      let rows = [];
      if (source.api_contents_url) {
        rows = await collectFromGitHubContents(source);
      } else if (source.readme_url) {
        rows = await collectFromReadme(source);
      }
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

  return { collected, sourceStats };
}

export async function updateSourcesMeta(existingSourcesMeta, allSources, skills = []) {
  const today = new Date().toISOString().slice(0, 10);
  const sourceMap = new Map((existingSourcesMeta.sources || []).map((s) => [s.name, { ...s }]));
  for (const s of allSources) {
    if (!sourceMap.has(s.name)) {
      sourceMap.set(s.name, {
        name: s.name,
        type: s.type || "directory",
        description: s.description || "Curated skills source.",
        url: s.source_url || s.url,
      });
    }
  }

  const sourceSkillCounts = new Map();
  for (const skill of skills || []) {
    const sourceName = skill?.source_name;
    if (!sourceName) continue;
    sourceSkillCounts.set(sourceName, (sourceSkillCounts.get(sourceName) || 0) + 1);
  }

  const sources = Array.from(sourceMap.values())
    .map((source) => ({
      ...source,
      skills_count: sourceSkillCounts.get(source.name) || 0,
    }))
    .filter((source) => source.skills_count > 0);

  return {
    last_updated: today,
    sources,
  };
}
