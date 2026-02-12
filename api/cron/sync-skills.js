import { list, put } from "@vercel/blob";

const SOURCES = [
  {
    name: "VoltAgent/awesome-openclaw-skills",
    source_url: "https://github.com/VoltAgent/awesome-openclaw-skills",
    readme_url:
      "https://raw.githubusercontent.com/VoltAgent/awesome-openclaw-skills/main/README.md",
    platform: "Codex",
  },
  {
    name: "Jeffallan/claude-skills",
    source_url: "https://github.com/Jeffallan/claude-skills",
    readme_url:
      "https://raw.githubusercontent.com/Jeffallan/claude-skills/main/README.md",
    platform: "Claude",
  },
  {
    name: "ComposioHQ/awesome-claude-skills",
    source_url: "https://github.com/ComposioHQ/awesome-claude-skills",
    readme_url:
      "https://raw.githubusercontent.com/ComposioHQ/awesome-claude-skills/master/README.md",
    platform: "Claude",
  },
  {
    name: "daymade/claude-code-skills",
    source_url: "https://github.com/daymade/claude-code-skills",
    api_contents_url:
      "https://api.github.com/repos/daymade/claude-code-skills/contents",
    platform: "Claude Code",
  },
];

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }
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

function toSkillRecord({ id, name, source, url, platform }) {
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
  };
}

function parseMarkdownLinks(markdown) {
  const results = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = regex.exec(markdown)) !== null) {
    const label = (m[1] || "").trim();
    const url = (m[2] || "").trim();
    if (!url) {
      continue;
    }
    results.push({ label, url });
  }
  return results;
}

function looksLikeSkillUrl(url) {
  const lower = String(url).toLowerCase();
  if (lower.includes("github.com") && lower.includes("/skill")) {
    return true;
  }
  if (lower.includes("awesomeskill.ai/skill/")) {
    return true;
  }
  return false;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "skills-cron-sync/1.0" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`fetch_failed:${response.status}:${url}`);
  }
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
  if (!response.ok) {
    throw new Error(`fetch_failed:${response.status}:${url}`);
  }
  return await response.json();
}

async function collectFromReadme(source) {
  const markdown = await fetchText(source.readme_url);
  const rawLinks = parseMarkdownLinks(markdown).filter((x) => looksLikeSkillUrl(x.url));
  const unique = new Map();
  for (const item of rawLinks) {
    const url = item.url.replace(/\/+$/, "");
    if (unique.has(url)) {
      continue;
    }
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
    if (!row || row.type !== "dir") {
      continue;
    }
    const name = row.name || "";
    if (!name || name.startsWith(".") || name === "assets") {
      continue;
    }
    const id = slugify(name);
    if (!id) {
      continue;
    }
    const url = `${source.source_url}/tree/main/${name}`;
    skills.push({ id, name: titleFromUrl(url), source, url, platform: source.platform });
  }
  return skills;
}

async function loadExistingSkills() {
  const direct = process.env.SKILLS_JSON_BLOB_URL;
  if (direct) {
    const resp = await fetch(direct, { cache: "no-store" });
    if (resp.ok) {
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: "skills-data/" });
    const latest = (blobs || []).find((b) => b.pathname === "skills-data/latest.json");
    if (latest?.url) {
      const resp = await fetch(latest.url, { cache: "no-store" });
      if (resp.ok) {
        const data = await resp.json();
        return Array.isArray(data) ? data : [];
      }
    }
  }

  const fallback = await fetch("https://www.ai-skills.xyz/data/skills.json", {
    cache: "no-store",
  });
  if (fallback.ok) {
    const data = await fallback.json();
    return Array.isArray(data) ? data : [];
  }
  return [];
}

function mergeSkills(existing, collected) {
  const byKey = new Map();
  for (const skill of existing) {
    const key = `${skill.source_name}::${skill.id}`;
    byKey.set(key, { ...skill });
  }

  let created = 0;
  let updated = 0;

  for (const item of collected) {
    const key = `${item.source.name}::${item.id}`;
    const prev = byKey.get(key);
    const nextBase = toSkillRecord(item);
    if (!prev) {
      byKey.set(key, nextBase);
      created += 1;
      continue;
    }

    let changed = false;
    const next = { ...prev };

    if (prev.detail_url !== item.url) {
      next.detail_url = item.url;
      changed = true;
    }
    if (!prev.name && nextBase.name) {
      next.name = nextBase.name;
      changed = true;
    }
    if (!Array.isArray(prev.platforms) || prev.platforms.length === 0) {
      next.platforms = nextBase.platforms;
      changed = true;
    }
    if (changed) {
      byKey.set(key, next);
      updated += 1;
    }
  }

  const merged = Array.from(byKey.values());
  merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return { merged, created, updated };
}

async function persistSkillsJson(skills) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { persisted: false, reason: "missing_blob_token" };
  }

  const buffer = Buffer.from(JSON.stringify(skills, null, 2) + "\n", "utf-8");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const versioned = await put(`skills-data/skills-${stamp}.json`, buffer, {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json; charset=utf-8",
  });

  const latest = await put("skills-data/latest.json", buffer, {
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
    const collected = [];
    const sourceStats = [];

    for (const source of SOURCES) {
      try {
        let rows = [];
        if (source.readme_url) {
          rows = await collectFromReadme(source);
        } else if (source.api_contents_url) {
          rows = await collectFromGitHubContents(source);
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

    const { merged, created, updated } = mergeSkills(existing, collected);
    const persist = await persistSkillsJson(merged);

    return res.status(200).json({
      ok: true,
      now: new Date().toISOString(),
      existing_count: existing.length,
      discovered_count: collected.length,
      total_count: merged.length,
      created,
      updated,
      persist,
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
