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
};

const normalize = (value) => String(value || "").toLowerCase();

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

  elements.category.appendChild(createOption("", "全部分类"));
  categories.forEach((item) => elements.category.appendChild(createOption(item, item)));

  elements.source.appendChild(createOption("", "全部来源"));
  sources.forEach((item) => elements.source.appendChild(createOption(item, item)));

  elements.platform.appendChild(createOption("", "全部平台"));
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
      normalize(skill.name).includes(search) ||
      normalize(skill.short_description).includes(search) ||
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

  state.filtered.forEach((skill) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = skill.name;

    const desc = document.createElement("p");
    desc.textContent = skill.short_description;

    const longDesc = document.createElement("p");
    longDesc.className = "card-long";
    longDesc.textContent = skill.long_description || "";

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
      ? `${skill.popularity_label}: ${skill.popularity.toLocaleString("en-US")}`
      : "官方/精选技能";
    meta.textContent = `${skill.category} · ${skill.source_name} · ${popularity}`;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const platform = document.createElement("div");
    platform.className = "meta";
    platform.textContent = skill.platforms.join(" / ");

    const action = document.createElement("a");
    action.href = skill.detail_url || skill.source_url;
    action.target = "_blank";
    action.rel = "noreferrer";
    action.textContent = "查看";

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

    elements.grid.appendChild(card);
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
    desc.textContent = source.description;

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
    "SELECT id, name, short_description, long_description, category, platforms, tags, popularity, popularity_label, source_name, source_url, detail_url FROM skills"
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

  buildFilters();
  initStats(sourcesData.last_updated);
  renderSources();
  renderCards();
  initButtons();

  [elements.search, elements.category, elements.source, elements.platform].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });
};

init();
