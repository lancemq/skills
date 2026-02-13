const qs = new URLSearchParams(window.location.search);
const skillId = qs.get("id") || "";
const LANGUAGE_STORAGE_KEY = "ai_skills_lang_v1";

const getInitialLang = () => {
  const fromQuery = qs.get("lang");
  if (fromQuery === "en" || fromQuery === "zh") {
    return fromQuery;
  }
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") {
      return saved;
    }
  } catch (_error) {
    // ignore storage errors
  }
  return "en";
};

let currentLang = getInitialLang();

const t = {
  en: {
    back: "Back",
    source: "Source",
    category: "Category",
    platforms: "Platforms",
    popularity: "Popularity",
    health: "Link Health",
    capability: "Capability",
    install: "Install",
    usage: "Usage Example",
    view: "View Source",
    ok: "Available",
    bad: "Unavailable",
    unknown: "Unknown",
    notFound: "Skill not found",
  },
  zh: {
    back: "返回",
    source: "来源",
    category: "分类",
    platforms: "平台",
    popularity: "热度",
    health: "链接状态",
    capability: "能力说明",
    install: "安装方式",
    usage: "使用示例",
    view: "查看来源",
    ok: "可用",
    bad: "异常",
    unknown: "未知",
    notFound: "未找到该技能",
  },
};

const elements = {
  title: document.getElementById("detail-title"),
  short: document.getElementById("detail-short"),
  long: document.getElementById("detail-long"),
  source: document.getElementById("detail-source"),
  category: document.getElementById("detail-category"),
  platforms: document.getElementById("detail-platforms"),
  popularity: document.getElementById("detail-popularity"),
  health: document.getElementById("detail-health"),
  installCode: document.getElementById("detail-install-code"),
  usageCode: document.getElementById("detail-usage-code"),
  view: document.getElementById("detail-view"),
  back: document.getElementById("detail-back"),
  lang: document.getElementById("detail-lang"),
  labelCategory: document.getElementById("label-category"),
  labelPlatforms: document.getElementById("label-platforms"),
  labelPopularity: document.getElementById("label-popularity"),
  labelHealth: document.getElementById("label-health"),
  labelCapability: document.getElementById("label-capability"),
  labelInstall: document.getElementById("label-install"),
  labelUsage: document.getElementById("label-usage"),
};

const getText = (key) => t[currentLang][key] || key;
const parseDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

function applyLabels() {
  document.documentElement.lang = currentLang === "zh" ? "zh-Hans" : "en";
  elements.back.textContent = getText("back");
  elements.lang.textContent = currentLang === "zh" ? "EN / 中文" : "EN / ZH";
  elements.labelCategory.textContent = getText("category");
  elements.labelPlatforms.textContent = getText("platforms");
  elements.labelPopularity.textContent = getText("popularity");
  elements.labelHealth.textContent = getText("health");
  elements.labelCapability.textContent = getText("capability");
  elements.labelInstall.textContent = getText("install");
  elements.labelUsage.textContent = getText("usage");
  elements.view.textContent = getText("view");
}

async function loadSkills() {
  try {
    const remote = await fetch("/api/skills", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_error) {}
  const local = await fetch("data/skills.json");
  return await local.json();
}

function renderSkill(skill) {
  const name = currentLang === "zh" ? skill.name_zh || skill.name : skill.name;
  const short =
    currentLang === "zh"
      ? skill.short_description_zh || skill.short_description
      : skill.short_description;
  const long =
    currentLang === "zh"
      ? skill.long_description_zh || skill.long_description
      : skill.long_description;

  elements.title.textContent = name;
  elements.short.textContent = short || "";
  elements.long.textContent = long || "";
  elements.source.textContent = `${getText("source")}: ${skill.source_name || "-"}`;
  elements.category.textContent = skill.category || "-";
  elements.platforms.textContent = (skill.platforms || []).join(" / ") || "-";
  elements.popularity.textContent = skill.popularity
    ? `${skill.popularity}`
    : "Official/Curated";

  const health =
    skill.link_status === "ok"
      ? `<span class="pill-ok">${getText("ok")}</span>`
      : skill.link_status === "bad"
        ? `<span class="pill-bad">${getText("bad")}</span>`
        : getText("unknown");
  const verified = parseDate(skill.verified_at);
  elements.health.innerHTML = verified ? `${health} · ${verified}` : health;

  elements.view.href = skill.detail_url || skill.source_url || "#";

  elements.installCode.textContent = `# Example\nmkdir -p $CODEX_HOME/skills/${skill.id}\n# copy SKILL.md into the folder`;
  elements.usageCode.textContent = `Use ${name} to help with this task:\n- Goal: ...\n- Constraints: ...\n- Output format: ...`;

  document.title = `${name} | AI Skills Hub`;
}

async function init() {
  applyLabels();
  const skills = await loadSkills();
  const skill = skills.find((s) => s.id === skillId);
  if (!skill) {
    elements.title.textContent = getText("notFound");
    return;
  }

  renderSkill(skill);
  elements.lang.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "zh" : "en";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLang);
    } catch (_error) {
      // ignore storage errors
    }
    applyLabels();
    renderSkill(skill);
  });
}

init();
