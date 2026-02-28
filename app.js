const state = {
  skills: [],
  filtered: [],
  sources: [],
  favorites: new Set(),
  favoriteGroups: {},
  rendered: {
    items: [],
    categoryCounts: {},
    categorySections: {},
    currentIndex: 0,
    batchSize: 36,
    isLoading: false,
  },
  observer: null,
  performance: {
    renderStart: 0,
    renderEnd: 0,
    cardsRendered: 0,
  },
};

const elements = {
  grid: document.getElementById("skill-grid"),
  search: document.getElementById("search"),
  searchSuggestions: document.getElementById("search-suggestions"),
  category: document.getElementById("category"),
  source: document.getElementById("source"),
  platform: document.getElementById("platform"),
  favorite: document.getElementById("favorite"),
  status: document.getElementById("status"),
  skillCount: document.getElementById("skill-count"),
  sourceCount: document.getElementById("source-count"),
  lastUpdated: document.getElementById("last-updated"),
  sourceList: document.getElementById("source-list"),
  eyebrow: document.getElementById("eyebrow"),
  heroTitle: document.getElementById("hero-title"),
  heroSub: document.getElementById("hero-sub"),
  btnBrowse: document.getElementById("btn-browse"),
  btnAbout: document.getElementById("btn-about"),
  btnMechanism: document.getElementById("btn-mechanism"),
  btnMcp: document.getElementById("btn-mcp"),
  btnLang: document.getElementById("btn-lang"),
  navHome: document.getElementById("nav-home"),
  navMechanism: document.getElementById("nav-mechanism"),
  navMcp: document.getElementById("nav-mcp"),
  navSources: document.getElementById("nav-sources"),
  weeklySectionTitle: document.getElementById("weekly-section-title"),
  weeklyNewTitle: document.getElementById("weekly-new-title"),
  weeklyUpdatedTitle: document.getElementById("weekly-updated-title"),
  weeklyNewList: document.getElementById("weekly-new-list"),
  weeklyUpdatedList: document.getElementById("weekly-updated-list"),
  favoritesPanel: document.getElementById("favorites-panel"),
  favoritesTitle: document.getElementById("favorites-title"),
  favoritesCount: document.getElementById("favorites-count"),
  favoritesEmpty: document.getElementById("favorites-empty"),
  favoritesGrid: document.getElementById("favorites-grid"),
  favoritesGroupFilter: document.getElementById("favorites-group-filter"),
  statSkillsLabel: document.getElementById("stat-skills-label"),
  statSourcesLabel: document.getElementById("stat-sources-label"),
  statUpdatedLabel: document.getElementById("stat-updated-label"),
  labelSearch: document.getElementById("label-search"),
  labelCategory: document.getElementById("label-category"),
  labelSource: document.getElementById("label-source"),
  labelPlatform: document.getElementById("label-platform"),
  labelFavorite: document.getElementById("label-favorite"),
  labelStatus: document.getElementById("label-status"),
  aboutTitle: document.getElementById("about-title"),
  aboutText: document.getElementById("about-text"),
  btnAllSources: document.getElementById("btn-all-sources"),
  footerText: document.getElementById("footer-text"),
};

const FAVORITES_STORAGE_KEY = "ai_skills_favorites_v1";
const FAVORITE_GROUPS_STORAGE_KEY = "ai_skills_favorite_groups_v1";
const LANGUAGE_STORAGE_KEY = "ai_skills_lang_v1";

const FAVORITE_GROUPS = ["favorites", "work", "research"];

const SYNONYM_MAP = {
  deploy: ["deployment", "发布", "部署"],
  seo: ["search engine", "搜索", "优化"],
  api: ["rest", "graphql", "grpc"],
  test: ["testing", "qa", "测试"],
  design: ["ui", "ux", "figma", "设计"],
};

const normalize = (value) => String(value || "").toLowerCase().trim();

const i18n = {
  en: {
    eyebrow: "Popular AI Skills · Catalog & Links",
    heroTitle: "A clean, searchable catalog of skills you can actually use.",
    heroSub: "Curated from public skill directories with fast search and clear detail links.",
    browse: "Browse Now",
    about: "About Sources",
    mechanism: "How Skills Work",
    mcp: "What is MCP",
    sources: "Sources",
    viewAllSources: "View All Sources",
    navHome: "Home",
    navMechanism: "How Skills Work",
    navMcp: "MCP Guide",
    navSources: "Sources",
    lang: "EN / ZH",
    statSkills: "Total Skills",
    statSources: "Sources",
    statUpdated: "Last Updated",
    labelSearch: "Search",
    labelCategory: "Category",
    labelSource: "Source",
    labelPlatform: "Platform",
    labelFavorite: "Favorites",
    labelStatus: "Status",
    placeholderSearch: "Search by name, tag, or description",
    allCategories: "All categories",
    allSources: "All sources",
    allPlatforms: "All platforms",
    allFavoriteModes: "All skills",
    favoritesOnly: "Favorites only",
    allStatus: "Active only",
    includeInactive: "Include inactive",
    aboutTitle: "Sources & Notes",
    aboutText: "Popularity is sourced from AwesomeSkill.ai. Official/community entries come from curated directories.",
    footer: "Made for your AI skill workflow · 2026",
    categoryCount: "items",
    uncategorized: "Uncategorized",
    popularityFallback: "Official/Curated",
    view: "View",
    details: "Details",
    addFavorite: "Add favorite",
    removeFavorite: "Remove favorite",
    source: "Source",
    weeklySectionTitle: "This Week",
    weeklyNewTitle: "New Skills",
    weeklyUpdatedTitle: "Updated Skills",
    noWeeklyItems: "No updates this week.",
    favoritesTitle: "Favorite Skills",
    favoritesEmpty: "No favorites yet.",
    groupAll: "All groups",
    groupFavorites: "Favorites",
    groupWork: "Work",
    groupResearch: "Research",
    noMatchingSkills: "No matching skills",
    sourceScore: "Quality",
  },
  zh: {
    eyebrow: "热门 AI Skills · 目录与下载",
    heroTitle: "把好用的技能集中到一个清晰、可下载的目录。",
    heroSub: "这里聚合了热门/官方技能目录，并提供快速检索与查看入口。",
    browse: "立即浏览",
    about: "数据来源说明",
    mechanism: "Skills 原理与作用",
    mcp: "什么是 MCP",
    sources: "数据来源",
    viewAllSources: "查看全部来源",
    navHome: "首页",
    navMechanism: "Skills 原理与作用",
    navMcp: "MCP 说明",
    navSources: "数据来源",
    lang: "EN / 中文",
    statSkills: "技能总数",
    statSources: "来源",
    statUpdated: "更新日期",
    labelSearch: "搜索技能",
    labelCategory: "分类",
    labelSource: "来源",
    labelPlatform: "平台",
    labelFavorite: "收藏",
    labelStatus: "状态",
    placeholderSearch: "输入技能名称、标签或描述",
    allCategories: "全部分类",
    allSources: "全部来源",
    allPlatforms: "全部平台",
    allFavoriteModes: "全部技能",
    favoritesOnly: "仅看收藏",
    allStatus: "仅显示有效",
    includeInactive: "包含失效",
    aboutTitle: "数据来源与说明",
    aboutText: "热门指标来自 AwesomeSkill.ai，官方/精选技能来自目录聚合站点。",
    footer: "Made for your AI skill workflow · 2026",
    categoryCount: "个",
    uncategorized: "未分类",
    popularityFallback: "官方/精选技能",
    view: "查看",
    details: "详情",
    addFavorite: "加入收藏",
    removeFavorite: "取消收藏",
    source: "来源",
    weeklySectionTitle: "本周更新",
    weeklyNewTitle: "本周新增",
    weeklyUpdatedTitle: "本周更新",
    noWeeklyItems: "本周暂无更新。",
    favoritesTitle: "收藏技能",
    favoritesEmpty: "还没有收藏技能。",
    groupAll: "全部分组",
    groupFavorites: "收藏",
    groupWork: "工作",
    groupResearch: "研究",
    noMatchingSkills: "没有匹配的技能",
    sourceScore: "质量分",
  },
};

const seoI18n = {
  en: {
    title: "AI Skills Hub | Discover and Compare AI Skills",
    description:
      "Discover, filter, and compare curated AI skills from multiple sources. Explore thousands of skills across development, design, productivity, and more.",
    keywords:
      "AI skills, Claude skills, Codex skills, skill marketplace, AI workflow, developer tools",
    ogDescription:
      "A searchable directory of curated AI skills with source links, categories, and platform filters.",
    twitterDescription:
      "Browse curated AI skills from multiple communities and marketplaces.",
    canonical: "https://www.ai-skills.xyz/?lang=en",
    ogLocale: "en_US",
  },
  zh: {
    title: "AI Skills Hub | 热门 AI Skills 导航与对比",
    description:
      "收录并对比热门 AI Skills，支持按分类、来源与平台筛选，帮助你快速找到可用技能。",
    keywords: "AI技能, Claude技能, Codex技能, 智能体技能, 工作流技能, 开发工具",
    ogDescription: "一个可搜索的 AI Skills 目录，提供来源链接、分类筛选与平台对比。",
    twitterDescription: "浏览来自社区与目录站点的 AI Skills，快速筛选并查看详情。",
    canonical: "https://www.ai-skills.xyz/?lang=zh",
    ogLocale: "zh_CN",
  },
};

const categoryMap = {
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

const sourceDescMap = {
  en: {
    "AwesomeSkill.ai": "Popular skills list with trend metrics.",
    "awesomeskills.dev": "Official and community skills directory.",
    "Awesome Skills App": "An additional skills directory and aggregator.",
  },
  zh: {
    "AwesomeSkill.ai": "提供热门 skills 与热度指数。",
    "awesomeskills.dev": "官方与社区 skills 目录。",
    "Awesome Skills App": "技能目录与聚合入口。",
  },
};

const getInitialLang = () => {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "zh") return urlLang;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch (_error) {}
  return "en";
};

let currentLang = getInitialLang();
const t = (key) => i18n[currentLang][key] || key;

const skillName = (skill) => (currentLang === "zh" ? skill.name_zh || skill.name : skill.name);
const skillShort = (skill) =>
  currentLang === "zh" ? skill.short_description_zh || skill.short_description : skill.short_description;
const skillLong = (skill) =>
  currentLang === "zh" ? skill.long_description_zh || skill.long_description : skill.long_description;

const parseDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const createOption = (value, label) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
};

const uniqueSorted = (items) => Array.from(new Set(items.filter(Boolean))).sort();
const API_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const getFavoriteGroup = (skillId) => state.favoriteGroups[skillId] || "favorites";
const isFavorite = (skillId) => state.favorites.has(skillId);

const loadFavorites = () => {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((id) => typeof id === "string") : []);
  } catch (_error) {
    return new Set();
  }
};

const loadFavoriteGroups = () => {
  try {
    const raw = window.localStorage.getItem(FAVORITE_GROUPS_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (_error) {
    return {};
  }
};

const persistFavorites = () => {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(state.favorites)));
    window.localStorage.setItem(FAVORITE_GROUPS_STORAGE_KEY, JSON.stringify(state.favoriteGroups));
  } catch (_error) {}
};

const applySeoMeta = () => {
  const meta = seoI18n[currentLang] || seoI18n.en;
  document.title = meta.title;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) el.setAttribute("content", value);
  };
  set("seo-description", meta.description);
  set("seo-keywords", meta.keywords);
  set("seo-og-title", meta.title);
  set("seo-og-description", meta.ogDescription);
  set("seo-og-url", meta.canonical);
  set("seo-og-locale", meta.ogLocale);
  set("seo-twitter-title", meta.title);
  set("seo-twitter-description", meta.twitterDescription);
  const canonical = document.getElementById("seo-canonical");
  if (canonical) canonical.setAttribute("href", meta.canonical);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLang);
  history.replaceState({}, "", `${url.pathname}${url.search}`);
};

const translateCategory = (value) => {
  if (!value) return t("uncategorized");
  if (currentLang === "zh") return value;
  return categoryMap[value] || value;
};

const popularityLabel = () =>
  currentLang === "zh" ? "热度指数（AwesomeSkill.ai）" : "Popularity (AwesomeSkill.ai)";

const expandSynonyms = (search) => {
  const expanded = [search];
  Object.entries(SYNONYM_MAP).forEach(([base, terms]) => {
    if (search.includes(base) || terms.some((x) => search.includes(normalize(x)))) {
      expanded.push(base, ...terms.map((x) => normalize(x)));
    }
  });
  return Array.from(new Set(expanded.filter(Boolean)));
};

const fuzzyScore = (haystack, needle) => {
  if (!needle) return 1;
  if (haystack.includes(needle)) return 1;
  const tokens = needle.split(/\s+/).filter(Boolean);
  let matched = 0;
  tokens.forEach((token) => {
    if (haystack.includes(token)) matched += 1;
  });
  return tokens.length ? matched / tokens.length : 0;
};

const buildFilters = () => {
  const selected = {
    category: elements.category.value,
    source: elements.source.value,
    platform: elements.platform.value,
    favorite: elements.favorite.value,
    status: elements.status.value || "active",
  };
  const visibleSkills = state.skills.filter((s) => s.is_active !== false || selected.status === "all");
  const categories = uniqueSorted(visibleSkills.map((skill) => skill.category));
  const sources = uniqueSorted(visibleSkills.map((skill) => skill.source_name));
  const platforms = uniqueSorted(visibleSkills.flatMap((skill) => skill.platforms || []));

  elements.category.innerHTML = "";
  elements.source.innerHTML = "";
  elements.platform.innerHTML = "";
  elements.favorite.innerHTML = "";
  elements.status.innerHTML = "";

  elements.category.appendChild(createOption("", t("allCategories")));
  categories.forEach((item) => elements.category.appendChild(createOption(item, translateCategory(item))));

  elements.source.appendChild(createOption("", t("allSources")));
  sources.forEach((item) => elements.source.appendChild(createOption(item, item)));

  elements.platform.appendChild(createOption("", t("allPlatforms")));
  platforms.forEach((item) => elements.platform.appendChild(createOption(item, item)));

  elements.favorite.appendChild(createOption("", t("allFavoriteModes")));
  elements.favorite.appendChild(createOption("favorites", t("favoritesOnly")));

  elements.status.appendChild(createOption("active", t("allStatus")));
  elements.status.appendChild(createOption("all", t("includeInactive")));

  elements.category.value = categories.includes(selected.category) ? selected.category : "";
  elements.source.value = sources.includes(selected.source) ? selected.source : "";
  elements.platform.value = platforms.includes(selected.platform) ? selected.platform : "";
  elements.favorite.value = selected.favorite === "favorites" ? "favorites" : "";
  elements.status.value = selected.status === "all" ? "all" : "active";
};

const buildSearchSuggestions = () => {
  if (!elements.searchSuggestions) return;
  const suggestions = uniqueSorted(
    state.skills.flatMap((skill) => [skill.name, skill.name_zh, ...(skill.tags || [])]).map((x) => String(x || "").trim())
  ).slice(0, 200);

  elements.searchSuggestions.innerHTML = "";
  suggestions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    elements.searchSuggestions.appendChild(option);
  });
};

const applyFilters = () => {
  const rawSearch = normalize(elements.search.value);
  const searches = expandSynonyms(rawSearch);
  const category = elements.category.value;
  const source = elements.source.value;
  const platform = elements.platform.value;
  const favoriteMode = elements.favorite.value;
  const statusMode = elements.status.value || "active";

  let filtered = state.skills.filter((skill) => {
    if (statusMode !== "all" && skill.is_active === false) return false;

    const haystack = normalize(
      [
        skillName(skill),
        skillShort(skill),
        skillLong(skill),
        (skill.tags || []).join(" "),
      ].join(" ")
    );

    const matchesSearch =
      !rawSearch || searches.some((q) => haystack.includes(q));

    const matchesCategory = !category || skill.category === category;
    const matchesSource = !source || skill.source_name === source;
    const matchesPlatform = !platform || (skill.platforms || []).includes(platform);
    const matchesFavorite = favoriteMode !== "favorites" || state.favorites.has(skill.id);

    return matchesSearch && matchesCategory && matchesSource && matchesPlatform && matchesFavorite;
  });

  if (rawSearch && filtered.length === 0) {
    filtered = state.skills
      .filter((skill) => (statusMode === "all" ? true : skill.is_active !== false))
      .map((skill) => {
        const haystack = normalize(
          [skillName(skill), skillShort(skill), skillLong(skill), (skill.tags || []).join(" ")].join(" ")
        );
        return { skill, score: fuzzyScore(haystack, rawSearch) };
      })
      .filter((x) => x.score >= 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 120)
      .map((x) => x.skill);
  }

  state.filtered = filtered;
  state.rendered.currentIndex = 0;
  state.rendered.items = [];
  state.rendered.categorySections = {};

  renderCards();
  renderFavoritesPanel();
};

const createFavoriteGroupSelect = (skillId) => {
  const select = document.createElement("select");
  select.className = "favorite-group-select";
  FAVORITE_GROUPS.forEach((group) => {
    const key = `group${group[0].toUpperCase()}${group.slice(1)}`;
    const label = t(key);
    select.appendChild(createOption(group, label));
  });
  select.value = getFavoriteGroup(skillId);
  select.addEventListener("change", (event) => {
    state.favoriteGroups[skillId] = event.target.value;
    persistFavorites();
    renderFavoritesPanel();
  });
  return select;
};

const createSkillCard = (skill) => {
  const card = document.createElement("article");
  card.className = "card";
  if (isFavorite(skill.id)) card.classList.add("is-favorited");

  const head = document.createElement("div");
  head.className = "card-head";

  const title = document.createElement("h3");
  title.textContent = skillName(skill);
  title.title = skillName(skill);

  const right = document.createElement("div");
  right.className = "card-head-right";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.type = "button";
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.textContent = isFavorite(skill.id) ? "★" : "☆";
  favoriteBtn.title = isFavorite(skill.id) ? t("removeFavorite") : t("addFavorite");
  favoriteBtn.setAttribute("aria-label", favoriteBtn.title);
  favoriteBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFavorite(skill.id)) {
      state.favorites.delete(skill.id);
      delete state.favoriteGroups[skill.id];
    } else {
      state.favorites.add(skill.id);
      state.favoriteGroups[skill.id] = state.favoriteGroups[skill.id] || "favorites";
    }
    persistFavorites();
    applyFilters();
  });

  right.appendChild(favoriteBtn);
  if (isFavorite(skill.id)) right.appendChild(createFavoriteGroupSelect(skill.id));

  head.appendChild(title);
  head.appendChild(right);

  const desc = document.createElement("p");
  desc.textContent = skillShort(skill);

  const longDesc = document.createElement("p");
  longDesc.className = "card-long";
  longDesc.textContent = skillLong(skill) || "";

  const badges = document.createElement("div");
  badges.className = "badges";
  (skill.tags || []).forEach((tag) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `#${tag}`;
    badges.appendChild(badge);
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  const popularity = skill.popularity
    ? `${popularityLabel()}: ${Number(skill.popularity).toLocaleString("en-US")}`
    : t("popularityFallback");
  meta.textContent = `${skill.source_name} · ${popularity}`;

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const platform = document.createElement("div");
  platform.className = "meta";
  platform.textContent = (skill.platforms || []).join(" / ");

  const action = document.createElement("a");
  action.className = "card-link";
  action.href = `skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(currentLang)}`;
  action.textContent = t("details");

  const sourceLink = document.createElement("a");
  sourceLink.className = "card-link";
  sourceLink.href = skill.detail_url || skill.source_url;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  sourceLink.textContent = t("view");

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.appendChild(action);
  actions.appendChild(sourceLink);

  footer.appendChild(platform);
  footer.appendChild(actions);

  card.appendChild(head);
  card.appendChild(desc);
  if (skill.long_description) card.appendChild(longDesc);
  card.appendChild(badges);
  card.appendChild(meta);
  card.appendChild(footer);

  return card;
};

const createLoadingIndicator = () => {
  const loading = document.createElement("div");
  loading.className = "loading-indicator";
  loading.id = "loading-indicator";
  loading.textContent = currentLang === "zh" ? "加载中..." : "Loading...";
  return loading;
};

const setupIntersectionObserver = () => {
  if (state.observer) state.observer.disconnect();

  state.observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !state.rendered.isLoading) renderNextBatch();
      });
    },
    { rootMargin: "200px", threshold: 0.1 }
  );

  const indicator = document.getElementById("loading-indicator");
  if (indicator) state.observer.observe(indicator);
};

const finalizeLoadingIndicator = () => {
  const indicator = document.getElementById("loading-indicator");
  if (!indicator) return;
  indicator.classList.add("is-done");
  const totalTime = state.performance.renderEnd - state.performance.renderStart;
  indicator.innerHTML = `
    ${currentLang === "zh" ? "已加载全部" : "All loaded"}
    <span style="font-size: 12px; opacity: 0.7; margin-left: 8px;">
      (${state.performance.cardsRendered} ${currentLang === "zh" ? "张卡片" : "cards"}, ${Math.max(0, Math.round(totalTime))}ms)
    </span>
  `;
  if (state.observer) state.observer.disconnect();
};

const renderNextBatch = () => {
  if (state.rendered.isLoading) return;

  const items = state.rendered.items;
  if (state.rendered.currentIndex >= items.length) {
    finalizeLoadingIndicator();
    return;
  }

  state.rendered.isLoading = true;
  requestAnimationFrame(() => {
    const batchEnd = Math.min(
      state.rendered.currentIndex + state.rendered.batchSize,
      items.length
    );

    const newSectionsFragment = document.createDocumentFragment();
    let cardsInBatch = 0;

    for (let i = state.rendered.currentIndex; i < batchEnd; i += 1) {
      const entry = items[i];
      const { category, skill } = entry;
      let sectionRef = state.rendered.categorySections[category];

      if (!sectionRef) {
        const section = document.createElement("section");
        section.className = "category-section";

        const header = document.createElement("div");
        header.className = "category-header";

        const title = document.createElement("h2");
        title.textContent = translateCategory(category);

        const count = document.createElement("span");
        count.className = "category-count";
        count.textContent = `${state.rendered.categoryCounts[category] || 0} ${t("categoryCount")}`;

        header.appendChild(title);
        header.appendChild(count);

        const list = document.createElement("div");
        list.className = "category-grid";

        section.appendChild(header);
        section.appendChild(list);

        sectionRef = { section, list };
        state.rendered.categorySections[category] = sectionRef;
        newSectionsFragment.appendChild(section);
      }

      sectionRef.list.appendChild(createSkillCard(skill));
      cardsInBatch += 1;
    }

    const indicator = document.getElementById("loading-indicator");
    if (indicator && indicator.parentNode && newSectionsFragment.childNodes.length) {
      indicator.parentNode.insertBefore(newSectionsFragment, indicator);
    }

    state.rendered.currentIndex = batchEnd;
    state.rendered.isLoading = false;
    state.performance.cardsRendered += cardsInBatch;
    state.performance.renderEnd = performance.now();

    if (state.rendered.currentIndex < items.length) setupIntersectionObserver();
    else finalizeLoadingIndicator();
  });
};

const renderCards = () => {
  elements.grid.innerHTML = "";
  state.performance.renderStart = performance.now();
  state.performance.cardsRendered = 0;

  const grouped = state.filtered.reduce((acc, skill) => {
    const key = skill.category || t("uncategorized");
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {});

  const sortedCategories = Object.entries(grouped).sort(([a], [b]) =>
    translateCategory(a).localeCompare(translateCategory(b), currentLang === "zh" ? "zh-Hans-CN" : "en")
  );

  if (!sortedCategories.length) {
    const empty = document.createElement("div");
    empty.className = "loading-indicator is-done";
    empty.textContent = t("noMatchingSkills");
    elements.grid.appendChild(empty);
    return;
  }

  const items = [];
  const categoryCounts = {};
  sortedCategories.forEach(([category, skills]) => {
    categoryCounts[category] = skills.length;
    skills.forEach((skill) => items.push({ category, skill }));
  });

  state.rendered.items = items;
  state.rendered.categoryCounts = categoryCounts;
  state.rendered.categorySections = {};
  state.rendered.currentIndex = 0;
  state.rendered.isLoading = false;

  elements.grid.appendChild(createLoadingIndicator());
  renderNextBatch();
};

const sourceQualityScore = (sourceName) => {
  const scoped = state.skills.filter((s) => s.source_name === sourceName);
  if (!scoped.length) return 0;
  const active = scoped.filter((s) => s.is_active !== false).length;
  const verified = scoped.filter((s) => s.link_status === "ok").length;
  const activeRatio = active / scoped.length;
  const verifiedRatio = verified / scoped.length;
  return Math.round((activeRatio * 0.6 + verifiedRatio * 0.4) * 100);
};

const renderSources = () => {
  elements.sourceList.innerHTML = "";
  state.sources.forEach((source) => {
    const item = document.createElement("div");
    item.className = "source-item";

    const title = document.createElement("strong");
    title.textContent = source.name;
    title.title = source.name;

    const score = document.createElement("span");
    score.className = "source-score";
    score.textContent = `${t("sourceScore")}: ${sourceQualityScore(source.name)}`;

    const desc = document.createElement("p");
    desc.textContent = (sourceDescMap[currentLang] && sourceDescMap[currentLang][source.name]) || source.description;

    const link = document.createElement("a");
    link.href = `sources.html?source=${encodeURIComponent(source.name)}&lang=${encodeURIComponent(currentLang)}`;
    link.className = "source-detail-link";
    link.textContent = currentLang === "zh" ? "查看来源详情" : "View source details";
    link.title = source.name;

    const external = document.createElement("a");
    external.href = source.url;
    external.target = "_blank";
    external.rel = "noreferrer";
    external.textContent = source.url;
    external.title = source.url;
    external.className = "source-external-link";

    item.appendChild(title);
    item.appendChild(score);
    item.appendChild(desc);
    item.appendChild(link);
    item.appendChild(external);
    elements.sourceList.appendChild(item);
  });
};

const renderWeeklySummary = () => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const base = state.skills.filter((skill) => skill.is_active !== false);

  const newSkills = base
    .filter((skill) => {
      const createdAt = parseDate(skill.created_at);
      return createdAt && createdAt >= weekAgo;
    })
    .sort((a, b) => (parseDate(b.created_at)?.getTime() || 0) - (parseDate(a.created_at)?.getTime() || 0))
    .slice(0, 8);

  const updatedSkills = base
    .filter((skill) => {
      const updatedAt = parseDate(skill.updated_at);
      const createdAt = parseDate(skill.created_at);
      if (!updatedAt || updatedAt < weekAgo) return false;
      if (createdAt && updatedAt.getTime() === createdAt.getTime()) return false;
      return true;
    })
    .sort((a, b) => (parseDate(b.updated_at)?.getTime() || 0) - (parseDate(a.updated_at)?.getTime() || 0))
    .slice(0, 8);

  const renderList = (el, arr, dateField) => {
    el.innerHTML = "";
    if (!arr.length) {
      const li = document.createElement("li");
      li.textContent = t("noWeeklyItems");
      el.appendChild(li);
      return;
    }
    arr.forEach((skill) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = `skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(currentLang)}`;
      link.textContent = skillName(skill);
      const when = document.createElement("span");
      when.className = "weekly-date";
      when.textContent = (parseDate(skill[dateField]) || new Date()).toISOString().slice(0, 10);
      li.appendChild(link);
      li.appendChild(when);
      el.appendChild(li);
    });
  };

  renderList(elements.weeklyNewList, newSkills, "created_at");
  renderList(elements.weeklyUpdatedList, updatedSkills, "updated_at");
};

const renderFavoritesGroupFilter = () => {
  if (!elements.favoritesGroupFilter) return;
  const current = elements.favoritesGroupFilter.value || "all";
  elements.favoritesGroupFilter.innerHTML = "";
  elements.favoritesGroupFilter.appendChild(createOption("all", t("groupAll")));
  elements.favoritesGroupFilter.appendChild(createOption("favorites", t("groupFavorites")));
  elements.favoritesGroupFilter.appendChild(createOption("work", t("groupWork")));
  elements.favoritesGroupFilter.appendChild(createOption("research", t("groupResearch")));
  elements.favoritesGroupFilter.value = current;
};

const renderFavoritesPanel = () => {
  if (!elements.favoritesPanel || !elements.favoritesGrid) return;
  renderFavoritesGroupFilter();
  const groupFilter = elements.favoritesGroupFilter ? elements.favoritesGroupFilter.value || "all" : "all";

  const favorites = state.skills
    .filter((skill) => state.favorites.has(skill.id) && skill.is_active !== false)
    .filter((skill) => (groupFilter === "all" ? true : getFavoriteGroup(skill.id) === groupFilter))
    .sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));

  elements.favoritesCount.textContent = `${favorites.length}`;
  elements.favoritesGrid.innerHTML = "";

  if (!favorites.length) {
    elements.favoritesEmpty.style.display = "block";
    return;
  }

  elements.favoritesEmpty.style.display = "none";

  favorites.forEach((skill) => {
    const item = document.createElement("article");
    item.className = "favorite-item";

    const name = document.createElement("h3");
    name.textContent = skillName(skill);

    const meta = document.createElement("p");
    const group = getFavoriteGroup(skill.id);
    const groupLabel = t(`group${group[0].toUpperCase()}${group.slice(1)}`);
    meta.textContent = `${skill.source_name} · ${(skill.platforms || []).join(" / ")} · ${groupLabel}`;

    const actions = document.createElement("div");
    actions.className = "favorite-actions";

    const details = document.createElement("a");
    details.href = `skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(currentLang)}`;
    details.textContent = t("details");

    const view = document.createElement("a");
    view.href = skill.detail_url || skill.source_url;
    view.target = "_blank";
    view.rel = "noreferrer";
    view.textContent = t("view");

    actions.appendChild(details);
    actions.appendChild(view);

    item.appendChild(name);
    item.appendChild(meta);
    item.appendChild(actions);
    elements.favoritesGrid.appendChild(item);
  });
};

const initStats = (lastUpdated) => {
  elements.skillCount.textContent = state.skills.filter((s) => s.is_active !== false).length;
  elements.sourceCount.textContent = state.sources.length;
  elements.lastUpdated.textContent = lastUpdated;
};

const applyLanguage = () => {
  document.documentElement.lang = currentLang === "zh" ? "zh-Hans" : "en";

  elements.eyebrow.textContent = t("eyebrow");
  elements.heroTitle.textContent = t("heroTitle");
  elements.heroSub.textContent = t("heroSub");
  elements.btnBrowse.textContent = t("browse");
  elements.btnAbout.textContent = t("about");
  elements.btnMechanism.textContent = t("mechanism");
  if (elements.btnMcp) {
    elements.btnMcp.textContent = t("mcp");
    elements.btnMcp.href = `mcp-protocol.html?lang=${encodeURIComponent(currentLang)}`;
  }
  elements.btnMechanism.href = `skills-mechanism.html?lang=${encodeURIComponent(currentLang)}`;
  elements.btnLang.textContent = t("lang");
  elements.navHome.textContent = t("navHome");
  elements.navMechanism.textContent = t("navMechanism");
  if (elements.navMcp) elements.navMcp.textContent = t("navMcp");
  elements.navHome.href = `index.html?lang=${encodeURIComponent(currentLang)}`;
  elements.navMechanism.href = `skills-mechanism.html?lang=${encodeURIComponent(currentLang)}`;
  if (elements.navMcp) elements.navMcp.href = `mcp-protocol.html?lang=${encodeURIComponent(currentLang)}`;
  if (elements.navSources) elements.navSources.textContent = t("navSources");
  if (elements.navSources) elements.navSources.href = `sources.html?lang=${encodeURIComponent(currentLang)}`;
  if (elements.weeklySectionTitle) elements.weeklySectionTitle.textContent = t("weeklySectionTitle");
  if (elements.weeklyNewTitle) elements.weeklyNewTitle.textContent = t("weeklyNewTitle");
  if (elements.weeklyUpdatedTitle) elements.weeklyUpdatedTitle.textContent = t("weeklyUpdatedTitle");
  if (elements.favoritesTitle) elements.favoritesTitle.textContent = t("favoritesTitle");
  if (elements.favoritesEmpty) elements.favoritesEmpty.textContent = t("favoritesEmpty");

  elements.statSkillsLabel.textContent = t("statSkills");
  elements.statSourcesLabel.textContent = t("statSources");
  elements.statUpdatedLabel.textContent = t("statUpdated");
  elements.labelSearch.textContent = t("labelSearch");
  elements.labelCategory.textContent = t("labelCategory");
  elements.labelSource.textContent = t("labelSource");
  elements.labelPlatform.textContent = t("labelPlatform");
  elements.labelFavorite.textContent = t("labelFavorite");
  elements.labelStatus.textContent = t("labelStatus");
  elements.search.placeholder = t("placeholderSearch");
  elements.aboutTitle.textContent = t("aboutTitle");
  elements.aboutText.textContent = t("aboutText");
  if (elements.btnAllSources) {
    elements.btnAllSources.textContent = t("viewAllSources");
    elements.btnAllSources.href = `sources.html?lang=${encodeURIComponent(currentLang)}`;
  }
  elements.footerText.textContent = t("footer");

  buildFilters();
  buildSearchSuggestions();
  renderSources();
  renderWeeklySummary();
  renderFavoritesPanel();
  applySeoMeta();

  state.rendered.currentIndex = 0;
  state.rendered.items = [];
  state.rendered.categorySections = {};
  renderCards();
};

const initButtons = () => {
  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "jump") document.getElementById("controls").scrollIntoView({ behavior: "smooth" });
      if (action === "about") document.getElementById("about").scrollIntoView({ behavior: "smooth" });
    });
  });

  if (elements.btnLang) {
    elements.btnLang.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "zh" : "en";
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLang);
      } catch (_error) {}
      applyLanguage();
    });
  }

  if (elements.favoritesGroupFilter) {
    elements.favoritesGroupFilter.addEventListener("change", () => {
      renderFavoritesPanel();
    });
  }
};

const loadSkillsFromDb = async () => {
  const ensureSqlJs = async () => {
    if (window.initSqlJs) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("sql.js load failed"));
      document.head.appendChild(script);
    });
  };

  await ensureSqlJs();

  const SQL = await initSqlJs({
    locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
  });

  const dbCandidates = ["/api/skills-db", "data/skills.db"];
  let buffer = null;

  for (const url of dbCandidates) {
    try {
      const response = await fetchWithTimeout(url, { cache: "default" });
      if (!response.ok) continue;
      buffer = await response.arrayBuffer();
      if (buffer && buffer.byteLength > 0) break;
    } catch (_error) {}
  }

  if (!buffer || buffer.byteLength === 0) throw new Error("db fetch failed");

  const db = new SQL.Database(new Uint8Array(buffer));
  const result = db.exec(
    "SELECT id, name, name_zh, short_description, short_description_zh, long_description, long_description_zh, category, platforms, tags, popularity, popularity_label, source_name, source_url, detail_url FROM skills"
  );

  if (!result.length) throw new Error("empty db");

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
};

const loadSkills = async () => {
  try {
    const remote = await fetchWithTimeout("/api/skills", { cache: "default" });
    if (remote.ok) {
      const data = await remote.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_error) {}

  try {
    const local = await fetch("data/skills.json", { cache: "default" });
    if (local.ok) {
      const data = await local.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (_error) {
    // Continue to DB fallback below.
  }

  return await loadSkillsFromDb();
};

const loadSourcesData = async () => {
  try {
    const remote = await fetchWithTimeout("/api/sources", { cache: "default" });
    if (remote.ok) {
      const data = await remote.json();
      if (data && Array.isArray(data.sources)) return data;
    }
  } catch (_error) {}

  const local = await fetch("data/sources.json", { cache: "default" });
  return await local.json();
};

const init = async () => {
  const [skills, sourcesData] = await Promise.all([loadSkills(), loadSourcesData()]);

  state.skills = (skills || []).map((skill) => ({
    ...skill,
    platforms: skill.platforms || [],
    tags: skill.tags || [],
    is_active: skill.is_active !== false,
  }));
  state.favorites = loadFavorites();
  state.favoriteGroups = loadFavoriteGroups();
  state.sources = sourcesData.sources || [];

  state.skills.sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
  // Keep initial rendered set aligned with default status filter ("active").
  state.filtered = state.skills.filter((skill) => skill.is_active !== false);

  initStats(sourcesData.last_updated || "--");
  applyLanguage();
  initButtons();

  [elements.search, elements.category, elements.source, elements.platform, elements.favorite, elements.status].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });
};

init();
