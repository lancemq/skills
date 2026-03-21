export const categoryMapEn = {
  开发: "Development",
  设计: "Design",
  生产力: "Productivity",
  内容: "Content",
  创意: "Creativity",
  工作流: "Workflow",
  文档: "Documents",
  品牌: "Brand",
  媒体: "Media",
  协作: "Collaboration",
  安全: "Security",
  业务: "Business",
  运营: "Operations",
  职业: "Career",
  研究: "Research",
};

const API_TIMEOUT_MS = 2500;

export function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateYmd(value) {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function loadSkillsData() {
  try {
    const remote = await fetchWithTimeout("/api/skills", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_error) {
    // ignore network failures and try local fallback
  }

  try {
    const local = await fetch("/data/skills.json", { cache: "no-store" });
    if (local.ok) {
      const data = await local.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (_error) {
    // ignore fallback failures
  }

  if (typeof window !== "undefined") {
    try {
      return await loadSkillsFromDb();
    } catch (_error) {
      // ignore db fallback failures
    }
  }

  return [];
}

export async function loadSourcesData() {
  try {
    const remote = await fetchWithTimeout("/api/sources", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (data && Array.isArray(data.sources)) return data.sources;
    }
  } catch (_error) {
    // ignore network failures and try local fallback
  }

  try {
    const local = await fetch("/data/sources.json", { cache: "no-store" });
    if (local.ok) {
      const data = await local.json();
      return Array.isArray(data?.sources) ? data.sources : [];
    }
  } catch (_error) {
    // ignore fallback failures
  }

  return [];
}

export function translateCategory(value, lang) {
  if (!value) return "-";
  if (lang === "zh") return value;
  return categoryMapEn[value] || value;
}

export function qualityScore(total, active, healthy) {
  if (!total) return 0;
  const activeRatio = active / total;
  const healthyRatio = healthy / total;
  return Math.round((activeRatio * 0.6 + healthyRatio * 0.4) * 100);
}

async function loadSkillsFromDb() {
  if (typeof window === "undefined") {
    return [];
  }

  await ensureSqlJs();

  const SQL = await window.initSqlJs({
    locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
  });

  const dbCandidates = ["/api/skills-db", "/data/skills.db"];
  let buffer = null;

  for (const url of dbCandidates) {
    try {
      const response = await fetchWithTimeout(url, { cache: "default" }, 8000);
      if (!response.ok) continue;
      buffer = await response.arrayBuffer();
      if (buffer && buffer.byteLength > 0) break;
    } catch (_error) {
      // continue trying fallbacks
    }
  }

  if (!buffer || buffer.byteLength === 0) {
    return [];
  }

  const db = new SQL.Database(new Uint8Array(buffer));
  const result = db.exec(
    "SELECT id, name, name_zh, short_description, short_description_zh, long_description, long_description_zh, category, platforms, tags, popularity, popularity_label, source_name, source_url, detail_url FROM skills"
  );

  if (!result.length) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const item = Object.fromEntries(columns.map((col, idx) => [col, row[idx]]));
    return {
      ...item,
      platforms: JSON.parse(item.platforms || "[]"),
      tags: JSON.parse(item.tags || "[]"),
      is_active: true,
    };
  });
}

async function ensureSqlJs() {
  if (window.initSqlJs) {
    return;
  }

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sqljs="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("sql.js load failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js";
    script.async = true;
    script.dataset.sqljs = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("sql.js load failed"));
    document.head.appendChild(script);
  });
}
