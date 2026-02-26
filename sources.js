const qs = new URLSearchParams(window.location.search);
const LANGUAGE_STORAGE_KEY = "ai_skills_lang_v1";
const API_TIMEOUT_MS = 2500;

const state = {
  currentLang: "en",
  sources: [],
  skills: [],
  rows: [],
  filtered: [],
  focusedSource: "",
};

const elements = {
  navHome: document.getElementById("nav-home"),
  navMechanism: document.getElementById("nav-mechanism"),
  navMcp: document.getElementById("nav-mcp"),
  navSources: document.getElementById("nav-sources"),
  lang: document.getElementById("sources-lang"),
  eyebrow: document.getElementById("sources-eyebrow"),
  title: document.getElementById("sources-title"),
  subtitle: document.getElementById("sources-subtitle"),
  search: document.getElementById("sources-search"),
  type: document.getElementById("sources-type"),
  status: document.getElementById("sources-status"),
  sort: document.getElementById("sources-sort"),
  labelSearch: document.getElementById("label-sources-search"),
  labelType: document.getElementById("label-sources-type"),
  labelStatus: document.getElementById("label-sources-status"),
  labelSort: document.getElementById("label-sources-sort"),
  grid: document.getElementById("sources-grid"),
  empty: document.getElementById("sources-empty"),
};

const i18n = {
  en: {
    navHome: "Home",
    navMechanism: "How Skills Work",
    navMcp: "MCP Guide",
    navSources: "Sources",
    lang: "EN / ZH",
    eyebrow: "Data Sources",
    title: "Source Directory and Health Overview",
    subtitle: "Compare source quality and activity, then jump to official source links.",
    searchLabel: "Search",
    typeLabel: "Type",
    statusLabel: "Status",
    sortLabel: "Sort",
    searchPlaceholder: "Search source name or description",
    typeAll: "All types",
    statusAll: "All status",
    statusHealthy: "Healthy",
    statusMixed: "Mixed",
    statusIssue: "Has issues",
    statusNoSkills: "No indexed skills",
    sortQuality: "Quality (high to low)",
    sortActive: "Active skills (high to low)",
    sortVerified: "Last verified (newest)",
    sortName: "Name (A-Z)",
    metricTotal: "Total skills",
    metricActive: "Active skills",
    metricHealth: "Healthy links",
    metricVerified: "Last verified",
    noVerified: "No verification",
    noMatches: "No matching sources.",
    openSource: "Open source site",
    browseSkills: "Back to skills",
    seoTitle: "Data Sources | AI Skills Hub",
    seoDescription:
      "Browse all data sources powering AI Skills Hub with quality metrics, active skill counts, and direct links.",
    seoKeywords: "AI skills sources, data sources, skill directories",
    seoOgDescription: "Browse all data sources with quality metrics, active skill counts, and source links.",
    seoTwitterDescription: "Compare source quality, status, and activity in one directory.",
  },
  zh: {
    navHome: "首页",
    navMechanism: "Skills 原理与作用",
    navMcp: "MCP 说明",
    navSources: "数据来源",
    lang: "EN / 中文",
    eyebrow: "数据来源",
    title: "数据来源列表与健康概览",
    subtitle: "对比每个来源的质量、活跃度与链接健康情况，并可直达官方链接。",
    searchLabel: "搜索",
    typeLabel: "类型",
    statusLabel: "状态",
    sortLabel: "排序",
    searchPlaceholder: "搜索来源名称或描述",
    typeAll: "全部类型",
    statusAll: "全部状态",
    statusHealthy: "健康",
    statusMixed: "混合",
    statusIssue: "存在异常",
    statusNoSkills: "暂无收录技能",
    sortQuality: "质量分（高到低）",
    sortActive: "活跃技能数（高到低）",
    sortVerified: "最近校验（最新）",
    sortName: "名称（A-Z）",
    metricTotal: "技能总数",
    metricActive: "活跃技能",
    metricHealth: "健康链接",
    metricVerified: "最近校验",
    noVerified: "暂无校验",
    noMatches: "没有匹配的数据来源。",
    openSource: "打开来源站点",
    browseSkills: "返回技能列表",
    seoTitle: "数据来源 | AI Skills Hub",
    seoDescription: "查看 AI Skills Hub 的全部数据来源、质量分、活跃技能数与外部链接。",
    seoKeywords: "AI技能来源, 数据来源, skills目录",
    seoOgDescription: "查看全部数据来源的质量、状态与活跃度。",
    seoTwitterDescription: "在一个目录中对比来源质量分、状态和活跃技能数。",
  },
};

const normalize = (value) => String(value || "").toLowerCase().trim();
const t = (key) => (i18n[state.currentLang] || i18n.en)[key] || key;

const fetchWithTimeout = async (url, options = {}, timeoutMs = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toDateYmd = (value) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
};

const qualityScore = (total, active, healthy) => {
  if (!total) return 0;
  const activeRatio = active / total;
  const healthyRatio = healthy / total;
  return Math.round((activeRatio * 0.6 + healthyRatio * 0.4) * 100);
};

const getInitialLang = () => {
  const fromQuery = qs.get("lang");
  if (fromQuery === "en" || fromQuery === "zh") return fromQuery;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch (_error) {}
  return "en";
};

const buildStatus = (row) => {
  if (!row.totalSkills) return "none";
  if (row.unhealthyLinks === 0 && row.healthyLinks > 0) return "healthy";
  if (row.healthyLinks > 0 && row.unhealthyLinks > 0) return "mixed";
  return "issues";
};

const applySeo = () => {
  const seoTitle = document.getElementById("seo-title");
  const seoDescription = document.getElementById("seo-description");
  const seoKeywords = document.getElementById("seo-keywords");
  const seoOgTitle = document.getElementById("seo-og-title");
  const seoOgDescription = document.getElementById("seo-og-description");
  const seoOgUrl = document.getElementById("seo-og-url");
  const seoTwitterTitle = document.getElementById("seo-twitter-title");
  const seoTwitterDescription = document.getElementById("seo-twitter-description");
  const canonical = document.getElementById("seo-canonical");

  document.title = t("seoTitle");
  if (seoTitle) seoTitle.textContent = t("seoTitle");
  if (seoDescription) seoDescription.setAttribute("content", t("seoDescription"));
  if (seoKeywords) seoKeywords.setAttribute("content", t("seoKeywords"));
  if (seoOgTitle) seoOgTitle.setAttribute("content", t("seoTitle"));
  if (seoOgDescription) seoOgDescription.setAttribute("content", t("seoOgDescription"));
  if (seoOgUrl) seoOgUrl.setAttribute("content", `https://www.ai-skills.xyz/sources.html?lang=${state.currentLang}`);
  if (seoTwitterTitle) seoTwitterTitle.setAttribute("content", t("seoTitle"));
  if (seoTwitterDescription) seoTwitterDescription.setAttribute("content", t("seoTwitterDescription"));
  if (canonical) canonical.setAttribute("href", `https://www.ai-skills.xyz/sources.html?lang=${state.currentLang}`);
};

const applyLabels = () => {
  document.documentElement.lang = state.currentLang === "zh" ? "zh-Hans" : "en";
  elements.navHome.textContent = t("navHome");
  elements.navHome.href = `index.html?lang=${encodeURIComponent(state.currentLang)}`;
  elements.navMechanism.textContent = t("navMechanism");
  if (elements.navMcp) elements.navMcp.textContent = t("navMcp");
  elements.navSources.textContent = t("navSources");
  elements.navMechanism.href = `skills-mechanism.html?lang=${encodeURIComponent(state.currentLang)}`;
  if (elements.navMcp) elements.navMcp.href = `mcp-protocol.html?lang=${encodeURIComponent(state.currentLang)}`;
  elements.navSources.href = `sources.html?lang=${encodeURIComponent(state.currentLang)}`;
  elements.lang.textContent = t("lang");
  elements.eyebrow.textContent = t("eyebrow");
  elements.title.textContent = t("title");
  elements.subtitle.textContent = t("subtitle");
  elements.labelSearch.textContent = t("searchLabel");
  elements.labelType.textContent = t("typeLabel");
  elements.labelStatus.textContent = t("statusLabel");
  elements.labelSort.textContent = t("sortLabel");
  elements.search.placeholder = t("searchPlaceholder");
  elements.empty.textContent = t("noMatches");
  applySeo();

  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.currentLang);
  history.replaceState({}, "", `${url.pathname}${url.search}`);
};

const loadSourcesData = async () => {
  try {
    const remote = await fetchWithTimeout("/api/sources", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (data && Array.isArray(data.sources)) return data.sources;
    }
  } catch (_error) {}
  const local = await fetch("data/sources.json");
  const data = await local.json();
  return Array.isArray(data.sources) ? data.sources : [];
};

const loadSkillsData = async () => {
  try {
    const remote = await fetchWithTimeout("/api/skills", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (Array.isArray(data)) return data;
    }
  } catch (_error) {}
  const local = await fetch("data/skills.json");
  return await local.json();
};

const buildRows = () => {
  const bySource = state.skills.reduce((acc, skill) => {
    const sourceName = skill.source_name || "";
    if (!sourceName) return acc;
    if (!acc[sourceName]) acc[sourceName] = [];
    acc[sourceName].push(skill);
    return acc;
  }, {});

  state.rows = state.sources.map((source) => {
    const scoped = bySource[source.name] || [];
    const totalSkills = scoped.length;
    const activeSkills = scoped.filter((item) => item.is_active !== false).length;
    const healthyLinks = scoped.filter((item) => item.link_status === "ok").length;
    const unhealthyLinks = scoped.filter((item) => item.link_status === "bad").length;
    const lastVerified = scoped
      .map((item) => parseDate(item.verified_at))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      ...source,
      totalSkills,
      activeSkills,
      healthyLinks,
      unhealthyLinks,
      quality: qualityScore(totalSkills, activeSkills, healthyLinks),
      lastVerified: lastVerified ? lastVerified.toISOString().slice(0, 10) : "",
    };
  });
};

const buildFilters = () => {
  const typeCurrent = elements.type.value;
  const statusCurrent = elements.status.value;
  const sortCurrent = elements.sort.value;

  const types = Array.from(new Set(state.rows.map((item) => item.type).filter(Boolean))).sort();

  elements.type.innerHTML = "";
  elements.type.appendChild(new Option(t("typeAll"), ""));
  types.forEach((value) => elements.type.appendChild(new Option(value, value)));
  elements.type.value = types.includes(typeCurrent) ? typeCurrent : "";

  elements.status.innerHTML = "";
  elements.status.appendChild(new Option(t("statusAll"), ""));
  elements.status.appendChild(new Option(t("statusHealthy"), "healthy"));
  elements.status.appendChild(new Option(t("statusMixed"), "mixed"));
  elements.status.appendChild(new Option(t("statusIssue"), "issues"));
  elements.status.appendChild(new Option(t("statusNoSkills"), "none"));
  elements.status.value = ["healthy", "mixed", "issues", "none"].includes(statusCurrent) ? statusCurrent : "";

  elements.sort.innerHTML = "";
  elements.sort.appendChild(new Option(t("sortQuality"), "quality"));
  elements.sort.appendChild(new Option(t("sortActive"), "active"));
  elements.sort.appendChild(new Option(t("sortVerified"), "verified"));
  elements.sort.appendChild(new Option(t("sortName"), "name"));
  elements.sort.value = ["quality", "active", "verified", "name"].includes(sortCurrent) ? sortCurrent : "quality";
};

const applyFilters = () => {
  const search = normalize(elements.search.value);
  const type = elements.type.value;
  const status = elements.status.value;
  const sort = elements.sort.value;

  state.filtered = state.rows.filter((row) => {
    const matchesSearch =
      !search ||
      [row.name, row.description, row.url, row.type].some((item) => normalize(item).includes(search));
    const matchesType = !type || row.type === type;
    const matchesStatus = !status || buildStatus(row) === status;
    return matchesSearch && matchesType && matchesStatus;
  });

  state.filtered.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "en");
    if (sort === "active") return b.activeSkills - a.activeSkills;
    if (sort === "verified") return (parseDate(b.lastVerified)?.getTime() || 0) - (parseDate(a.lastVerified)?.getTime() || 0);
    return b.quality - a.quality;
  });

  renderRows();
};

const renderRows = () => {
  elements.grid.innerHTML = "";
  elements.empty.hidden = state.filtered.length > 0;
  if (!state.filtered.length) return;

  state.filtered.forEach((row) => {
    const card = document.createElement("article");
    card.className = "source-directory-card";
    if (state.focusedSource && row.name === state.focusedSource) {
      card.classList.add("source-directory-card--focus");
    }

    const title = document.createElement("h2");
    title.textContent = row.name;
    title.title = row.name;

    const type = document.createElement("span");
    type.className = "source-directory-type";
    type.textContent = row.type || "-";

    const desc = document.createElement("p");
    desc.className = "source-directory-desc";
    desc.textContent = row.description || "";

    const metrics = document.createElement("div");
    metrics.className = "source-directory-metrics";

    const metricData = [
      [t("metricTotal"), String(row.totalSkills)],
      [t("metricActive"), String(row.activeSkills)],
      [t("metricHealth"), `${row.healthyLinks}/${row.totalSkills || 0}`],
      [t("metricVerified"), row.lastVerified || t("noVerified")],
    ];

    metricData.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "source-directory-metric";
      const name = document.createElement("strong");
      name.textContent = label;
      const val = document.createElement("span");
      val.textContent = value;
      item.appendChild(name);
      item.appendChild(val);
      metrics.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.className = "source-directory-actions";

    const openSource = document.createElement("a");
    openSource.href = row.url;
    openSource.target = "_blank";
    openSource.rel = "noreferrer";
    openSource.textContent = t("openSource");

    const browseSkills = document.createElement("a");
    browseSkills.href = `index.html?lang=${encodeURIComponent(state.currentLang)}`;
    browseSkills.textContent = t("browseSkills");

    actions.appendChild(openSource);
    actions.appendChild(browseSkills);

    card.appendChild(type);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(metrics);
    card.appendChild(actions);
    elements.grid.appendChild(card);
  });
};

const init = async () => {
  state.currentLang = getInitialLang();
  state.focusedSource = qs.get("source") || "";
  applyLabels();

  const [sources, skills] = await Promise.all([loadSourcesData(), loadSkillsData()]);
  state.sources = sources;
  state.skills = Array.isArray(skills) ? skills : [];
  buildRows();
  buildFilters();

  if (state.focusedSource) {
    elements.search.value = state.focusedSource;
  }
  applyFilters();

  elements.lang.addEventListener("click", () => {
    state.currentLang = state.currentLang === "en" ? "zh" : "en";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.currentLang);
    } catch (_error) {}
    applyLabels();
    buildFilters();
    applyFilters();
  });

  [elements.search, elements.type, elements.status, elements.sort].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });
};

init();
