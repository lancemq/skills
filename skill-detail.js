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

const seoText = {
  en: {
    title: "Skill Details | AI Skills Hub",
    description:
      "Detailed AI skill profile with use cases, setup, input/output examples, and source links.",
    keywords: "AI skill detail, Claude skill, Codex skill, prompt workflow",
  },
  zh: {
    title: "Skill 详情 | AI Skills Hub",
    description: "查看技能详情，包括用途、安装方式、使用示例和来源链接。",
    keywords: "AI技能详情, Claude技能, Codex技能, 工作流提示词",
  },
};

const t = {
  en: {
    back: "Back",
    home: "Home",
    how: "How Skills Work",
    mcp: "MCP Guide",
    sources: "Sources",
    source: "Source",
    category: "Category",
    platforms: "Platforms",
    popularity: "Popularity",
    health: "Link Health",
    capability: "Capability",
    install: "Install",
    usage: "Usage Example",
    related: "Similar Skills",
    noRelated: "No similar skills found.",
    view: "View Source",
    ok: "Available",
    bad: "Unavailable",
    unknown: "Unknown",
    notFound: "Skill not found",
  },
  zh: {
    back: "返回",
    home: "首页",
    how: "Skills 原理与作用",
    mcp: "MCP 说明",
    sources: "数据来源",
    source: "来源",
    category: "分类",
    platforms: "平台",
    popularity: "热度",
    health: "链接状态",
    capability: "能力说明",
    install: "安装方式",
    usage: "使用示例",
    related: "相似技能",
    noRelated: "暂无相似技能。",
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
  navHome: document.getElementById("nav-home"),
  navMechanism: document.getElementById("nav-mechanism"),
  navMcp: document.getElementById("nav-mcp"),
  navSources: document.getElementById("nav-sources"),
  labelCategory: document.getElementById("label-category"),
  labelPlatforms: document.getElementById("label-platforms"),
  labelPopularity: document.getElementById("label-popularity"),
  labelHealth: document.getElementById("label-health"),
  labelCapability: document.getElementById("label-capability"),
  labelInstall: document.getElementById("label-install"),
  labelUsage: document.getElementById("label-usage"),
  labelRelated: document.getElementById("label-related"),
  relatedList: document.getElementById("related-list"),
};

const getText = (key) => t[currentLang][key] || key;
const categoryMapEn = {
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
const translateCategory = (value) => {
  if (!value) return "-";
  if (currentLang === "zh") return value;
  return categoryMapEn[value] || value;
};
const parseDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const buildUsageExample = (skill) => {
  const name = currentLang === "zh" ? skill.name_zh || skill.name : skill.name;
  const tags = (skill.tags || []).map((item) => String(item).toLowerCase());
  const hasTag = (needle) => tags.some((item) => item.includes(needle));

  const byTag = [
    {
      match: () => hasTag("seo") || hasTag("content"),
      en: {
        scene: "Website content optimization",
        prompt:
          `Use "${name}" to review this article for SEO.\n` +
          "Target keyword: [keyword]\n" +
          "Article draft: [paste content]\n" +
          "Please return: title/meta rewrite, heading improvements, internal link suggestions, and top 5 actionable fixes.",
      },
      zh: {
        scene: "网站内容优化",
        prompt:
          `请使用「${name}」审查这篇文章的 SEO。\n` +
          "目标关键词：[关键词]\n" +
          "文章草稿：[粘贴内容]\n" +
          "请输出：标题/描述改写、标题结构优化、内链建议，以及最优先的 5 条修改项。",
      },
    },
    {
      match: () => hasTag("ui") || hasTag("ux") || hasTag("design") || hasTag("frontend"),
      en: {
        scene: "Landing page redesign",
        prompt:
          `Use "${name}" to redesign this page.\n` +
          "Current page goal: [goal]\n" +
          "Audience: [target users]\n" +
          "Constraints: mobile first, keep brand colors.\n" +
          "Please return: layout proposal, visual hierarchy, component list, and a first-pass implementation plan.",
      },
      zh: {
        scene: "落地页改版",
        prompt:
          `请使用「${name}」重做这个页面。\n` +
          "当前页面目标：[目标]\n" +
          "受众：[目标用户]\n" +
          "约束：移动端优先，保留品牌色。\n" +
          "请输出：版式方案、信息层级、组件清单，以及首轮实现计划。",
      },
    },
    {
      match: () =>
        hasTag("api-development") ||
        hasTag("openapi") ||
        hasTag("graphql") ||
        hasTag("grpc") ||
        hasTag("backend") ||
        hasTag("microservices"),
      en: {
        scene: "API service design",
        prompt:
          `Use "${name}" to design a production-ready API.\n` +
          "Business requirement: [requirement]\n" +
          "Data entities: [entities]\n" +
          "Non-functional needs: auth, rate limit, observability.\n" +
          "Please return: endpoint/proto/schema draft, validation rules, error model, and rollout checklist.",
      },
      zh: {
        scene: "API 服务设计",
        prompt:
          `请使用「${name}」设计一个可上线的 API 服务。\n` +
          "业务需求：[需求]\n" +
          "数据实体：[实体]\n" +
          "非功能要求：鉴权、限流、可观测性。\n" +
          "请输出：接口/协议草案、校验规则、错误模型和上线检查清单。",
      },
    },
    {
      match: () => hasTag("research") || hasTag("notes"),
      en: {
        scene: "Research synthesis",
        prompt:
          `Use "${name}" to synthesize these materials.\n` +
          "Sources: [links/files]\n" +
          "Question: [core question]\n" +
          "Please return: key findings, evidence table, open questions, and a concise executive summary.",
      },
      zh: {
        scene: "研究资料归纳",
        prompt:
          `请使用「${name}」整理这批资料。\n` +
          "来源：[链接/文件]\n" +
          "核心问题：[问题]\n" +
          "请输出：关键结论、证据表、待验证问题，以及一段管理层摘要。",
      },
    },
    {
      match: () => hasTag("planning") || hasTag("files"),
      en: {
        scene: "Project planning from files",
        prompt:
          `Use "${name}" to build an execution plan from these files.\n` +
          "Repo/docs: [paths]\n" +
          "Deadline: [date]\n" +
          "Please return: milestones, task breakdown, dependencies, and risk controls.",
      },
      zh: {
        scene: "基于文件的项目规划",
        prompt:
          `请使用「${name}」根据这些文件制定执行计划。\n` +
          "仓库/文档：[路径]\n" +
          "截止时间：[日期]\n" +
          "请输出：里程碑、任务拆解、依赖关系和风险控制点。",
      },
    },
    {
      match: () => hasTag("video") || hasTag("remotion"),
      en: {
        scene: "Programmatic video workflow",
        prompt:
          `Use "${name}" to plan a Remotion video workflow.\n` +
          "Topic: [topic]\n" +
          "Duration: [seconds]\n" +
          "Assets available: [assets]\n" +
          "Please return: scene breakdown, animation timeline, component structure, and render optimization tips.",
      },
      zh: {
        scene: "程序化视频工作流",
        prompt:
          `请使用「${name}」规划 Remotion 视频工作流。\n` +
          "主题：[主题]\n" +
          "时长：[秒数]\n" +
          "可用素材：[素材]\n" +
          "请输出：分镜拆解、动画时间线、组件结构，以及渲染优化建议。",
      },
    },
  ];

  const matched = byTag.find((entry) => entry.match());
  const fallbackEn = {
    scene: "General skill execution",
    prompt:
      `Use "${name}" for this task.\n` +
      "Goal: [what you want]\n" +
      "Input/context: [data/files/background]\n" +
      "Constraints: [time/format/quality limits]\n" +
      "Please return: execution steps, final output, and validation checklist.",
  };
  const fallbackZh = {
    scene: "通用任务执行",
    prompt:
      `请使用「${name}」完成这个任务。\n` +
      "目标：[你要达成什么]\n" +
      "输入/上下文：[数据/文件/背景]\n" +
      "约束：[时间/格式/质量要求]\n" +
      "请输出：执行步骤、最终结果和验收清单。",
  };

  const payload = matched ? (currentLang === "zh" ? matched.zh : matched.en) : currentLang === "zh" ? fallbackZh : fallbackEn;
  if (currentLang === "zh") {
    return `场景：${payload.scene}\n\n你可以这样提问：\n${payload.prompt}`;
  }
  return `Scenario: ${payload.scene}\n\nTry this prompt:\n${payload.prompt}`;
};

function applyLabels() {
  document.documentElement.lang = currentLang === "zh" ? "zh-Hans" : "en";
  elements.back.textContent = getText("back");
  elements.lang.textContent = currentLang === "zh" ? "EN / 中文" : "EN / ZH";
  elements.navHome.textContent = getText("home");
  elements.navMechanism.textContent = getText("how");
  if (elements.navMcp) elements.navMcp.textContent = getText("mcp");
  if (elements.navSources) elements.navSources.textContent = getText("sources");
  elements.navHome.href = `index.html?lang=${encodeURIComponent(currentLang)}`;
  elements.navMechanism.href = `skills-mechanism.html?lang=${encodeURIComponent(currentLang)}`;
  if (elements.navMcp) elements.navMcp.href = `mcp-protocol.html?lang=${encodeURIComponent(currentLang)}`;
  if (elements.navSources) elements.navSources.href = `sources.html?lang=${encodeURIComponent(currentLang)}`;
  elements.labelCategory.textContent = getText("category");
  elements.labelPlatforms.textContent = getText("platforms");
  elements.labelPopularity.textContent = getText("popularity");
  elements.labelHealth.textContent = getText("health");
  elements.labelCapability.textContent = getText("capability");
  elements.labelInstall.textContent = getText("install");
  elements.labelUsage.textContent = getText("usage");
  elements.labelRelated.textContent = getText("related");
  elements.view.textContent = getText("view");
  const meta = seoText[currentLang] || seoText.en;
  document.title = meta.title;
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) {
      el.setAttribute("content", value);
    }
  };
  set("seo-description", meta.description);
  set("seo-keywords", meta.keywords);
  const canonical = document.getElementById("seo-canonical");
  if (canonical) {
    canonical.setAttribute(
      "href",
      `https://www.ai-skills.xyz/skill-detail.html?lang=${currentLang}`
    );
  }
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLang);
  history.replaceState({}, "", `${url.pathname}${url.search}`);
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
  elements.category.textContent = translateCategory(skill.category);
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
  elements.usageCode.textContent = buildUsageExample(skill);

  document.title = `${name} | AI Skills Hub`;
}

function renderSimilar(skills, currentSkill) {
  if (!elements.relatedList) return;
  const currentTags = new Set((currentSkill.tags || []).map((item) => String(item).toLowerCase()));
  const withScore = skills
    .filter((item) => item.id !== currentSkill.id && item.is_active !== false)
    .map((item) => {
      const tags = (item.tags || []).map((tag) => String(tag).toLowerCase());
      let score = 0;
      if (item.category && currentSkill.category && item.category === currentSkill.category) score += 3;
      if (item.source_name && currentSkill.source_name && item.source_name === currentSkill.source_name) score += 1;
      const overlap = tags.filter((tag) => currentTags.has(tag)).length;
      score += overlap * 2;
      score += Math.min(Number(item.popularity) || 0, 100000) / 100000;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.item);

  elements.relatedList.innerHTML = "";
  if (!withScore.length) {
    const empty = document.createElement("p");
    empty.textContent = getText("noRelated");
    elements.relatedList.appendChild(empty);
    return;
  }

  withScore.forEach((item) => {
    const card = document.createElement("article");
    card.className = "related-item";
    const link = document.createElement("a");
    link.href = `skill-detail.html?id=${encodeURIComponent(item.id)}&lang=${encodeURIComponent(currentLang)}`;
    link.textContent = currentLang === "zh" ? item.name_zh || item.name : item.name;
    const desc = document.createElement("p");
    desc.textContent =
      currentLang === "zh"
        ? item.short_description_zh || item.short_description || ""
        : item.short_description || "";
    card.appendChild(link);
    card.appendChild(desc);
    elements.relatedList.appendChild(card);
  });
}

function updateStructuredData(skill) {
  const name = currentLang === "zh" ? skill.name_zh || skill.name : skill.name;
  const description =
    currentLang === "zh"
      ? skill.short_description_zh || skill.short_description || ""
      : skill.short_description || "";
  const data = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: name,
    description,
    inLanguage: currentLang === "zh" ? "zh-CN" : "en-US",
    about: skill.category || "AI Skill",
    url: window.location.href,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Skills Hub",
      url: "https://www.ai-skills.xyz/",
    },
  };
  const existing = document.getElementById("detail-structured-data");
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.id = "detail-structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
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
  renderSimilar(skills, skill);
  updateStructuredData(skill);
  elements.lang.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "zh" : "en";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLang);
    } catch (_error) {
      // ignore storage errors
    }
    applyLabels();
    renderSkill(skill);
    renderSimilar(skills, skill);
    updateStructuredData(skill);
  });
}

init();
