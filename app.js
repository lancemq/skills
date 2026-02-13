const state = {
  skills: [],
  filtered: [],
  sources: [],
  rendered: {
    categories: [],
    currentIndex: 0,
    batchSize: 50,
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
  category: document.getElementById("category"),
  source: document.getElementById("source"),
  platform: document.getElementById("platform"),
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
  btnLang: document.getElementById("btn-lang"),
  navBrowse: document.getElementById("nav-browse"),
  navMechanism: document.getElementById("nav-mechanism"),
  navSources: document.getElementById("nav-sources"),
  quickMechanismTitle: document.getElementById("quick-mechanism-title"),
  quickMechanismSub: document.getElementById("quick-mechanism-sub"),
  footerMechanismLink: document.getElementById("footer-mechanism-link"),
  weeklySectionTitle: document.getElementById("weekly-section-title"),
  weeklyNewTitle: document.getElementById("weekly-new-title"),
  weeklyUpdatedTitle: document.getElementById("weekly-updated-title"),
  weeklyNewList: document.getElementById("weekly-new-list"),
  weeklyUpdatedList: document.getElementById("weekly-updated-list"),
  statSkillsLabel: document.getElementById("stat-skills-label"),
  statSourcesLabel: document.getElementById("stat-sources-label"),
  statUpdatedLabel: document.getElementById("stat-updated-label"),
  labelSearch: document.getElementById("label-search"),
  labelCategory: document.getElementById("label-category"),
  labelSource: document.getElementById("label-source"),
  labelPlatform: document.getElementById("label-platform"),
  aboutTitle: document.getElementById("about-title"),
  aboutText: document.getElementById("about-text"),
  footerText: document.getElementById("footer-text"),
};

const normalize = (value) => String(value || "").toLowerCase();

const i18n = {
  en: {
    eyebrow: "Popular AI Skills · Catalog & Links",
    heroTitle: "A clean, searchable catalog of skills you can actually use.",
    heroSub:
      "Curated from public skill directories with fast search and clear detail links.",
    browse: "Browse Now",
    about: "About Sources",
    mechanism: "How Skills Work",
    navBrowse: "Browse",
    navSources: "Sources",
    quickMechanismTitle: "How Skills Work",
    quickMechanismSub:
      "Understand the mechanism, core principles, and practical value of AI skills.",
    footerMechanismLink: "How Skills Work",
    lang: "EN / ZH",
    statSkills: "Total Skills",
    statSources: "Sources",
    statUpdated: "Last Updated",
    labelSearch: "Search",
    labelCategory: "Category",
    labelSource: "Source",
    labelPlatform: "Platform",
    placeholderSearch: "Search by name, tag, or description",
    allCategories: "All categories",
    allSources: "All sources",
    allPlatforms: "All platforms",
    aboutTitle: "Sources & Notes",
    aboutText:
      "Popularity is sourced from AwesomeSkill.ai. Official/community entries come from curated directories. You can expand sources or add GitHub sync.",
    footer: "Made for your AI skill workflow · 2026",
    categoryCount: "items",
    uncategorized: "Uncategorized",
    popularityFallback: "Official/Curated",
    view: "View",
    details: "Details",
    source: "Source",
    weeklySectionTitle: "This Week",
    weeklyNewTitle: "New Skills",
    weeklyUpdatedTitle: "Updated Skills",
    noWeeklyItems: "No updates this week.",
  },
  zh: {
    eyebrow: "热门 AI Skills · 目录与下载",
    heroTitle: "把好用的技能集中到一个清晰、可下载的目录。",
    heroSub:
      "这里聚合了热门/官方技能目录，并提供快速检索与查看入口。",
    browse: "立即浏览",
    about: "数据来源说明",
    mechanism: "Skills 原理与作用",
    navBrowse: "浏览",
    navSources: "来源",
    quickMechanismTitle: "Skills 原理与作用",
    quickMechanismSub: "了解 AI skills 的机制原理、核心作用与实践价值。",
    footerMechanismLink: "Skills 原理与作用",
    lang: "EN / 中文",
    statSkills: "技能总数",
    statSources: "来源",
    statUpdated: "更新日期",
    labelSearch: "搜索技能",
    labelCategory: "分类",
    labelSource: "来源",
    labelPlatform: "平台",
    placeholderSearch: "输入技能名称、标签或描述",
    allCategories: "全部分类",
    allSources: "全部来源",
    allPlatforms: "全部平台",
    aboutTitle: "数据来源与说明",
    aboutText:
      "热门指标来自 AwesomeSkill.ai 的公开列表，官方/精选技能来自目录聚合站点。你可以按需求继续扩充数据源或添加 GitHub 自动同步。",
    footer: "Made for your AI skill workflow · 2026",
    categoryCount: "个",
    uncategorized: "未分类",
    popularityFallback: "官方/精选技能",
    view: "查看",
    details: "详情",
    source: "来源",
    weeklySectionTitle: "本周更新",
    weeklyNewTitle: "本周新增",
    weeklyUpdatedTitle: "本周更新",
    noWeeklyItems: "本周暂无更新。",
  },
};

const categoryMap = {
  en: {
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
  },
  zh: {},
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

let currentLang = "en";

const t = (key) => i18n[currentLang][key] || key;

const translateCategory = (value) => {
  if (!value) {
    return t("uncategorized");
  }
  if (currentLang === "zh") {
    return value;
  }
  return categoryMap.en[value] || value;
};

const skillName = (skill) =>
  currentLang === "zh" ? skill.name_zh || skill.name : skill.name;
const skillShort = (skill) =>
  currentLang === "zh"
    ? skill.short_description_zh || skill.short_description
    : skill.short_description;
const skillLong = (skill) =>
  currentLang === "zh"
    ? skill.long_description_zh || skill.long_description
    : skill.long_description;

const popularityLabel = () =>
  currentLang === "zh"
    ? "热度指数（AwesomeSkill.ai）"
    : "Popularity (AwesomeSkill.ai)";

const createOption = (value, label) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
};

const uniqueSorted = (items) => Array.from(new Set(items)).sort();
const parseDate = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const buildFilters = () => {
  const categories = uniqueSorted(state.skills.map((skill) => skill.category));
  const sources = uniqueSorted(state.skills.map((skill) => skill.source_name));
  const platforms = uniqueSorted(state.skills.flatMap((skill) => skill.platforms));

  elements.category.innerHTML = "";
  elements.source.innerHTML = "";
  elements.platform.innerHTML = "";

  elements.category.appendChild(createOption("", t("allCategories")));
  categories.forEach((item) =>
    elements.category.appendChild(createOption(item, translateCategory(item)))
  );

  elements.source.appendChild(createOption("", t("allSources")));
  sources.forEach((item) => elements.source.appendChild(createOption(item, item)));

  elements.platform.appendChild(createOption("", t("allPlatforms")));
  platforms.forEach((item) => elements.platform.appendChild(createOption(item, item)));
};

const applyFilters = () => {
  const search = normalize(elements.search.value);
  const category = elements.category.value;
  const source = elements.source.value;
  const platform = elements.platform.value;

  state.filtered = state.skills.filter((skill) => {
    const matchesSearch =
      !search ||
      normalize(skillName(skill)).includes(search) ||
      normalize(skillShort(skill)).includes(search) ||
      normalize(skillLong(skill)).includes(search) ||
      normalize(skill.tags.join(" ")).includes(search);
    const matchesCategory = !category || skill.category === category;
    const matchesSource = !source || skill.source_name === source;
    const matchesPlatform = !platform || skill.platforms.includes(platform);
    return matchesSearch && matchesCategory && matchesSource && matchesPlatform;
  });

  // Reset virtual scroll state
  state.rendered.currentIndex = 0;
  state.rendered.categories = [];
  
  renderCards();
};

const createSkillCard = (skill) => {
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = skillName(skill);

  const desc = document.createElement("p");
  desc.textContent = skillShort(skill);

  const longDesc = document.createElement("p");
  longDesc.className = "card-long";
  longDesc.textContent = skillLong(skill) || "";

  const badges = document.createElement("div");
  badges.className = "badges";

  skill.tags.forEach((tag) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `#${tag}`;
    badges.appendChild(badge);
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  const popularity = skill.popularity
    ? `${popularityLabel()}: ${skill.popularity.toLocaleString("en-US")}`
    : t("popularityFallback");
  meta.textContent = `${skill.source_name} · ${popularity}`;

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const platform = document.createElement("div");
  platform.className = "meta";
  platform.textContent = skill.platforms.join(" / ");

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

  card.appendChild(title);
  card.appendChild(desc);
  if (skill.long_description) {
    card.appendChild(longDesc);
  }
  card.appendChild(badges);
  card.appendChild(meta);
  card.appendChild(footer);

  return card;
};

const createLoadingIndicator = () => {
  const loading = document.createElement("div");
  loading.className = "loading-indicator";
  loading.id = "loading-indicator";
  loading.style.cssText = `
    padding: 40px;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
  `;
  loading.textContent = currentLang === "zh" ? "加载中..." : "Loading...";
  return loading;
};

const setupIntersectionObserver = () => {
  if (state.observer) {
    state.observer.disconnect();
  }

  state.observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !state.rendered.isLoading) {
          renderNextBatch();
        }
      });
    },
    {
      rootMargin: "200px",
      threshold: 0.1,
    }
  );

  const indicator = document.getElementById("loading-indicator");
  if (indicator) {
    state.observer.observe(indicator);
  }
};

const renderNextBatch = () => {
  if (state.rendered.isLoading) return;
  
  const categories = state.rendered.categories;
  if (state.rendered.currentIndex >= categories.length) {
    const indicator = document.getElementById("loading-indicator");
    if (indicator) {
      const totalTime = state.performance.renderEnd - state.performance.renderStart;
      indicator.innerHTML = `
        ${currentLang === "zh" ? "已加载全部" : "All loaded"} 
        <span style="font-size: 12px; opacity: 0.7; margin-left: 8px;">
          (${state.performance.cardsRendered} ${currentLang === "zh" ? "张卡片" : "cards"}, 
          ${totalTime}ms)
        </span>
      `;
      indicator.style.color = "var(--muted)";
    }
    return;
  }

  state.rendered.isLoading = true;
  
  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    const batchStart = performance.now();
    
    const batchEnd = Math.min(
      state.rendered.currentIndex + state.rendered.batchSize,
      categories.length
    );

    const fragment = document.createDocumentFragment();
    let cardsInBatch = 0;
    
    for (let i = state.rendered.currentIndex; i < batchEnd; i++) {
      const [category, skills] = categories[i];
      
      const section = document.createElement("section");
      section.className = "category-section";

      const header = document.createElement("div");
      header.className = "category-header";

      const title = document.createElement("h2");
      title.textContent = translateCategory(category);

      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = `${skills.length} ${t("categoryCount")}`;

      header.appendChild(title);
      header.appendChild(count);

      const list = document.createElement("div");
      list.className = "category-grid";

      skills.forEach((skill) => {
        list.appendChild(createSkillCard(skill));
        cardsInBatch++;
      });

      section.appendChild(header);
      section.appendChild(list);
      fragment.appendChild(section);
    }

    const indicator = document.getElementById("loading-indicator");
    if (indicator && indicator.parentNode) {
      indicator.parentNode.insertBefore(fragment, indicator);
    }

    state.rendered.currentIndex = batchEnd;
    state.rendered.isLoading = false;
    state.performance.cardsRendered += cardsInBatch;
    state.performance.renderEnd = performance.now();
    
    const batchTime = performance.now() - batchStart;
    console.log(`🎨 Rendered batch: ${cardsInBatch} cards in ${batchTime.toFixed(2)}ms`);

    // Continue observing if there are more items
    if (state.rendered.currentIndex < categories.length) {
      setupIntersectionObserver();
    }
  });
};

const renderCards = () => {
  elements.grid.innerHTML = "";
  
  // Reset performance tracking
  state.performance.renderStart = performance.now();
  state.performance.cardsRendered = 0;

  const grouped = state.filtered.reduce((acc, skill) => {
    const key = skill.category || t("uncategorized");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(skill);
    return acc;
  }, {});

  const sortedCategories = Object.entries(grouped).sort(([a], [b]) =>
    translateCategory(a).localeCompare(
      translateCategory(b),
      currentLang === "zh" ? "zh-Hans-CN" : "en"
    )
  );

  state.rendered.categories = sortedCategories;
  state.rendered.currentIndex = 0;
  state.rendered.isLoading = false;
  
  console.log(`📊 Total skills to render: ${state.filtered.length} across ${sortedCategories.length} categories`);

  // Add loading indicator
  elements.grid.appendChild(createLoadingIndicator());

  // Render first batch
  renderNextBatch();
};

const renderSources = () => {
  elements.sourceList.innerHTML = "";
  state.sources.forEach((source) => {
    const item = document.createElement("div");
    item.className = "source-item";

    const title = document.createElement("strong");
    title.textContent = source.name;

    const desc = document.createElement("p");
    desc.textContent =
      sourceDescMap[currentLang][source.name] || source.description;

    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.url;

    item.appendChild(title);
    item.appendChild(desc);
    item.appendChild(link);

    elements.sourceList.appendChild(item);
  });
};

const renderWeeklySummary = () => {
  if (!elements.weeklyNewList || !elements.weeklyUpdatedList) {
    return;
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newSkills = state.skills
    .filter((skill) => {
      const createdAt = parseDate(skill.created_at);
      return createdAt && createdAt >= weekAgo;
    })
    .sort((a, b) => {
      const ad = parseDate(a.created_at)?.getTime() || 0;
      const bd = parseDate(b.created_at)?.getTime() || 0;
      return bd - ad;
    })
    .slice(0, 8);

  const updatedSkills = state.skills
    .filter((skill) => {
      const updatedAt = parseDate(skill.updated_at);
      const createdAt = parseDate(skill.created_at);
      if (!updatedAt || updatedAt < weekAgo) {
        return false;
      }
      if (createdAt && updatedAt.getTime() === createdAt.getTime()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ad = parseDate(a.updated_at)?.getTime() || 0;
      const bd = parseDate(b.updated_at)?.getTime() || 0;
      return bd - ad;
    })
    .slice(0, 8);

  const createItem = (skill, dateField) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(currentLang)}`;
    link.textContent = skillName(skill);
    li.appendChild(link);
    const when = document.createElement("span");
    when.className = "weekly-date";
    const dt = parseDate(skill[dateField]);
    when.textContent = dt ? dt.toISOString().slice(0, 10) : "";
    li.appendChild(when);
    return li;
  };

  elements.weeklyNewList.innerHTML = "";
  elements.weeklyUpdatedList.innerHTML = "";

  if (!newSkills.length) {
    const li = document.createElement("li");
    li.textContent = t("noWeeklyItems");
    elements.weeklyNewList.appendChild(li);
  } else {
    newSkills.forEach((skill) => elements.weeklyNewList.appendChild(createItem(skill, "created_at")));
  }

  if (!updatedSkills.length) {
    const li = document.createElement("li");
    li.textContent = t("noWeeklyItems");
    elements.weeklyUpdatedList.appendChild(li);
  } else {
    updatedSkills.forEach((skill) => elements.weeklyUpdatedList.appendChild(createItem(skill, "updated_at")));
  }
};

const initStats = (lastUpdated) => {
  elements.skillCount.textContent = state.skills.length;
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
  elements.btnLang.textContent = t("lang");
  elements.navBrowse.textContent = t("navBrowse");
  elements.navMechanism.textContent = t("mechanism");
  elements.navSources.textContent = t("navSources");
  if (elements.quickMechanismTitle) {
    elements.quickMechanismTitle.textContent = t("quickMechanismTitle");
  }
  if (elements.quickMechanismSub) {
    elements.quickMechanismSub.textContent = t("quickMechanismSub");
  }
  if (elements.footerMechanismLink) {
    elements.footerMechanismLink.textContent = t("footerMechanismLink");
  }
  if (elements.weeklySectionTitle) {
    elements.weeklySectionTitle.textContent = t("weeklySectionTitle");
  }
  if (elements.weeklyNewTitle) {
    elements.weeklyNewTitle.textContent = t("weeklyNewTitle");
  }
  if (elements.weeklyUpdatedTitle) {
    elements.weeklyUpdatedTitle.textContent = t("weeklyUpdatedTitle");
  }
  elements.statSkillsLabel.textContent = t("statSkills");
  elements.statSourcesLabel.textContent = t("statSources");
  elements.statUpdatedLabel.textContent = t("statUpdated");
  elements.labelSearch.textContent = t("labelSearch");
  elements.labelCategory.textContent = t("labelCategory");
  elements.labelSource.textContent = t("labelSource");
  elements.labelPlatform.textContent = t("labelPlatform");
  elements.search.placeholder = t("placeholderSearch");
  elements.aboutTitle.textContent = t("aboutTitle");
  elements.aboutText.textContent = t("aboutText");
  elements.footerText.textContent = t("footer");

  buildFilters();
  renderSources();
  renderWeeklySummary();
  
  // Reset virtual scroll for language change
  state.rendered.currentIndex = 0;
  state.rendered.categories = [];
  
  renderCards();
};

const initButtons = () => {
  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "jump") {
        document.getElementById("controls").scrollIntoView({ behavior: "smooth" });
      }
      if (action === "about") {
        document.getElementById("about").scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  if (elements.btnLang) {
    elements.btnLang.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "zh" : "en";
      applyLanguage();
    });
  }
};

const loadSkillsFromDb = async () => {
  if (!window.initSqlJs) {
    throw new Error("sql.js not available");
  }

  const SQL = await initSqlJs({
    locateFile: (file) =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
  });

  const dbCandidates = ["/api/skills-db", "data/skills.db"];
  let buffer = null;

  for (const url of dbCandidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      buffer = await response.arrayBuffer();
      if (buffer && buffer.byteLength > 0) {
        break;
      }
    } catch (_error) {
      // Try the next candidate.
    }
  }

  if (!buffer || buffer.byteLength === 0) {
    throw new Error("db fetch failed");
  }

  const db = new SQL.Database(new Uint8Array(buffer));
  const result = db.exec(
    "SELECT id, name, name_zh, short_description, short_description_zh, long_description, long_description_zh, category, platforms, tags, popularity, popularity_label, source_name, source_url, detail_url FROM skills"
  );

  if (!result.length) {
    throw new Error("empty db");
  }

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const item = Object.fromEntries(columns.map((col, idx) => [col, row[idx]]));
    return {
      ...item,
      platforms: JSON.parse(item.platforms || "[]"),
      tags: JSON.parse(item.tags || "[]"),
    };
  });
};

const loadSkills = async () => {
  try {
    const remote = await fetch("/api/skills", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (_error) {
    // Fall through to DB and then local JSON.
  }

  try {
    return await loadSkillsFromDb();
  } catch (error) {
    const res = await fetch("data/skills.json");
    return await res.json();
  }
};

const loadSourcesData = async () => {
  try {
    const remote = await fetch("/api/sources", { cache: "no-store" });
    if (remote.ok) {
      const data = await remote.json();
      if (data && Array.isArray(data.sources)) {
        return data;
      }
    }
  } catch (_error) {
    // Fall back to local sources data.
  }

  const local = await fetch("data/sources.json");
  return await local.json();
};

const init = async () => {
  const [skills, sourcesRes] = await Promise.all([
    loadSkills(),
    loadSourcesData(),
  ]);

  state.skills = skills;
  const sourcesData = sourcesRes;
  state.sources = sourcesData.sources;

  state.skills.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  state.filtered = [...state.skills];

  initStats(sourcesData.last_updated);
  applyLanguage();
  initButtons();

  [elements.search, elements.category, elements.source, elements.platform].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });
};

init();
