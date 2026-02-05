const state = {
  skills: [],
  filtered: [],
  sources: [],
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
  btnLang: document.getElementById("btn-lang"),
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
    lang: "EN / 中文",
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
  },
  zh: {
    eyebrow: "热门 AI Skills · 目录与下载",
    heroTitle: "把好用的技能集中到一个清晰、可下载的目录。",
    heroSub:
      "这里聚合了热门/官方技能目录，并提供快速检索与查看入口。",
    browse: "立即浏览",
    about: "数据来源说明",
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

  renderCards();
};

const renderCards = () => {
  elements.grid.innerHTML = "";

  const grouped = state.filtered.reduce((acc, skill) => {
    const key = skill.category || t("uncategorized");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(skill);
    return acc;
  }, {});

  Object.entries(grouped)
    .sort(([a], [b]) =>
      translateCategory(a).localeCompare(
        translateCategory(b),
        currentLang === "zh" ? "zh-Hans-CN" : "en"
      )
    )
    .forEach(([category, skills]) => {
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
        action.href = skill.detail_url || skill.source_url;
        action.target = "_blank";
        action.rel = "noreferrer";
        action.textContent = t("view");

        footer.appendChild(platform);
        footer.appendChild(action);

        card.appendChild(title);
        card.appendChild(desc);
        if (skill.long_description) {
          card.appendChild(longDesc);
        }
        card.appendChild(badges);
        card.appendChild(meta);
        card.appendChild(footer);

        list.appendChild(card);
      });

      section.appendChild(header);
      section.appendChild(list);
      elements.grid.appendChild(section);
    });
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
  elements.btnLang.textContent = t("lang");
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
  const response = await fetch("data/skills.db");
  const buffer = await response.arrayBuffer();
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
    return await loadSkillsFromDb();
  } catch (error) {
    const res = await fetch("data/skills.json");
    return await res.json();
  }
};

const init = async () => {
  const [skills, sourcesRes] = await Promise.all([
    loadSkills(),
    fetch("data/sources.json"),
  ]);

  state.skills = skills;
  const sourcesData = await sourcesRes.json();
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
