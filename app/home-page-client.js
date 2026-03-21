"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import DocNav from "./_components/doc-nav";
import { LANGUAGE_STORAGE_KEY, normalizeLang, withLang } from "./_lib/i18n";
import {
  loadSkillsData,
  loadSourcesData,
  normalize,
  parseDate,
  qualityScore,
  translateCategory,
} from "./_lib/skill-data";

const FAVORITES_STORAGE_KEY = "ai_skills_favorites_v1";
const FAVORITE_GROUPS_STORAGE_KEY = "ai_skills_favorite_groups_v1";
const FAVORITE_GROUPS = ["favorites", "work", "research"];

const SYNONYM_MAP = {
  deploy: ["deployment", "发布", "部署"],
  seo: ["search engine", "搜索", "优化"],
  api: ["rest", "graphql", "grpc"],
  test: ["testing", "qa", "测试"],
  design: ["ui", "ux", "figma", "设计"],
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

const i18n = {
  en: {
    eyebrow: "Popular AI Skills · Catalog & Links",
    heroTitle: "A clean, searchable catalog of skills you can actually use.",
    heroSub: "Curated from public skill directories with fast search and clear detail links.",
    browse: "Browse Now",
    about: "About Sources",
    mechanism: "How Skills Work",
    mcp: "What is MCP",
    viewAllSources: "View All Sources",
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
    viewAllSources: "查看全部来源",
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

function expandSynonyms(search) {
  const expanded = [search];
  Object.entries(SYNONYM_MAP).forEach(([base, terms]) => {
    if (search.includes(base) || terms.some((x) => search.includes(normalize(x)))) {
      expanded.push(base, ...terms.map((x) => normalize(x)));
    }
  });
  return Array.from(new Set(expanded.filter(Boolean)));
}

function fuzzyScore(haystack, needle) {
  if (!needle) return 1;
  if (haystack.includes(needle)) return 1;
  const tokens = needle.split(/\s+/).filter(Boolean);
  let matched = 0;
  tokens.forEach((token) => {
    if (haystack.includes(token)) matched += 1;
  });
  return tokens.length ? matched / tokens.length : 0;
}

function uniqueSorted(items) {
  return Array.from(new Set(items.filter(Boolean))).sort();
}

function skillName(skill, lang) {
  return lang === "zh" ? skill.name_zh || skill.name : skill.name;
}

function skillShort(skill, lang) {
  return lang === "zh" ? skill.short_description_zh || skill.short_description : skill.short_description;
}

function skillLong(skill, lang) {
  return lang === "zh" ? skill.long_description_zh || skill.long_description : skill.long_description;
}

function loadFavorites() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((id) => typeof id === "string") : [];
  } catch (_error) {
    return [];
  }
}

function loadFavoriteGroups() {
  try {
    const raw = window.localStorage.getItem(FAVORITE_GROUPS_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch (_error) {
    return {};
  }
}

function persistFavorites(favorites, favoriteGroups) {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    window.localStorage.setItem(FAVORITE_GROUPS_STORAGE_KEY, JSON.stringify(favoriteGroups));
  } catch (_error) {
    // ignore storage failures
  }
}

function sourceQualityScore(skills, sourceName) {
  const scoped = skills.filter((s) => s.source_name === sourceName);
  if (!scoped.length) return 0;
  const active = scoped.filter((s) => s.is_active !== false).length;
  const verified = scoped.filter((s) => s.link_status === "ok").length;
  return qualityScore(scoped.length, active, verified);
}

function renderWeekly(skills) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const base = skills.filter((skill) => skill.is_active !== false);

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

  return { newSkills, updatedSkills };
}

function HomeSkillCard({ skill, lang, copy, isFavorite, favoriteGroup, onToggleFavorite, onChangeGroup }) {
  const translatedName = skillName(skill, lang);
  const longDescription = skillLong(skill, lang);
  const popularity = skill.popularity
    ? `${lang === "zh" ? "热度指数（AwesomeSkill.ai）" : "Popularity (AwesomeSkill.ai)"}: ${Number(skill.popularity).toLocaleString("en-US")}`
    : copy.popularityFallback;

  return (
    <article className={`card${isFavorite ? " is-favorited" : ""}`}>
      <div className="card-head">
        <h3 title={translatedName}>{translatedName}</h3>
        <div className="card-head-right">
          <button
            type="button"
            className="favorite-btn"
            title={isFavorite ? copy.removeFavorite : copy.addFavorite}
            aria-label={isFavorite ? copy.removeFavorite : copy.addFavorite}
            onClick={() => onToggleFavorite(skill.id)}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          {isFavorite ? (
            <select
              className="favorite-group-select"
              value={favoriteGroup}
              onChange={(event) => onChangeGroup(skill.id, event.target.value)}
            >
              {FAVORITE_GROUPS.map((group) => {
                const key = `group${group[0].toUpperCase()}${group.slice(1)}`;
                return (
                  <option key={group} value={group}>
                    {copy[key]}
                  </option>
                );
              })}
            </select>
          ) : null}
        </div>
      </div>

      <p>{skillShort(skill, lang)}</p>
      {longDescription ? <p className="card-long">{longDescription}</p> : null}
      <div className="badges">
        {(skill.tags || []).map((tag) => (
          <span className="badge" key={`${skill.id}-${tag}`}>
            #{tag}
          </span>
        ))}
      </div>
      <div className="meta">{`${skill.source_name} · ${popularity}`}</div>
      <div className="card-footer">
        <div className="meta">{(skill.platforms || []).join(" / ")}</div>
        <div className="card-actions">
          <Link href={`/skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(lang)}`}>
            {copy.details}
          </Link>
          <a href={skill.detail_url || skill.source_url} target="_blank" rel="noreferrer">
            {copy.view}
          </a>
        </div>
      </div>
    </article>
  );
}

export default function HomePageClient({ initialLang }) {
  const searchParams = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang") || initialLang);
  const copy = i18n[lang] || i18n.en;

  const [skills, setSkills] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("--");
  const [favorites, setFavorites] = useState([]);
  const [favoriteGroups, setFavoriteGroups] = useState({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [platform, setPlatform] = useState("");
  const [favoriteMode, setFavoriteMode] = useState("");
  const [statusMode, setStatusMode] = useState("active");
  const [favoritesGroupFilter, setFavoritesGroupFilter] = useState("all");
  const controlsRef = useRef(null);
  const aboutRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_error) {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    setFavorites(loadFavorites());
    setFavoriteGroups(loadFavoriteGroups());
  }, []);

  useEffect(() => {
    persistFavorites(favorites, favoriteGroups);
  }, [favorites, favoriteGroups]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [nextSkills, nextSourcesData] = await Promise.all([loadSkillsData(), loadSourcesData()]);
      if (cancelled) return;
      const normalizedSkills = (nextSkills || []).map((skill) => ({
        ...skill,
        platforms: skill.platforms || [],
        tags: skill.tags || [],
        is_active: skill.is_active !== false,
      }));
      normalizedSkills.sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
      setSkills(normalizedSkills);
      setSources(nextSourcesData.sources || nextSourcesData || []);
      setLastUpdated(nextSourcesData.last_updated || "--");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const visibleSkills = skills.filter((s) => s.is_active !== false || statusMode === "all");
    return uniqueSorted(visibleSkills.map((skill) => skill.category));
  }, [skills, statusMode]);

  const sourceOptions = useMemo(() => {
    const visibleSkills = skills.filter((s) => s.is_active !== false || statusMode === "all");
    return uniqueSorted(visibleSkills.map((skill) => skill.source_name));
  }, [skills, statusMode]);

  const platformOptions = useMemo(() => {
    const visibleSkills = skills.filter((s) => s.is_active !== false || statusMode === "all");
    return uniqueSorted(visibleSkills.flatMap((skill) => skill.platforms || []));
  }, [skills, statusMode]);

  const searchSuggestions = useMemo(
    () =>
      uniqueSorted(
        skills.flatMap((skill) => [skill.name, skill.name_zh, ...(skill.tags || [])]).map((x) => String(x || "").trim())
      ).slice(0, 200),
    [skills]
  );

  const filteredSkills = useMemo(() => {
    const rawSearch = normalize(search);
    const searches = expandSynonyms(rawSearch);

    let filtered = skills.filter((skill) => {
      if (statusMode !== "all" && skill.is_active === false) return false;

      const haystack = normalize([skillName(skill, lang), skillShort(skill, lang), skillLong(skill, lang), (skill.tags || []).join(" ")].join(" "));
      const matchesSearch = !rawSearch || searches.some((q) => haystack.includes(q));
      const matchesCategory = !category || skill.category === category;
      const matchesSource = !source || skill.source_name === source;
      const matchesPlatform = !platform || (skill.platforms || []).includes(platform);
      const matchesFavorite = favoriteMode !== "favorites" || favorites.includes(skill.id);

      return matchesSearch && matchesCategory && matchesSource && matchesPlatform && matchesFavorite;
    });

    if (rawSearch && filtered.length === 0) {
      filtered = skills
        .filter((skill) => (statusMode === "all" ? true : skill.is_active !== false))
        .map((skill) => {
          const haystack = normalize([skillName(skill, lang), skillShort(skill, lang), skillLong(skill, lang), (skill.tags || []).join(" ")].join(" "));
          return { skill, score: fuzzyScore(haystack, rawSearch) };
        })
        .filter((entry) => entry.score >= 0.6)
        .sort((a, b) => b.score - a.score)
        .slice(0, 120)
        .map((entry) => entry.skill);
    }

    return filtered;
  }, [skills, statusMode, search, category, source, platform, favoriteMode, favorites, lang]);

  const groupedSkills = useMemo(() => {
    const grouped = filteredSkills.reduce((acc, skill) => {
      const key = skill.category || copy.uncategorized;
      if (!acc[key]) acc[key] = [];
      acc[key].push(skill);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) =>
      translateCategory(a, lang).localeCompare(translateCategory(b, lang), lang === "zh" ? "zh-Hans-CN" : "en")
    );
  }, [filteredSkills, copy.uncategorized, lang]);

  const weekly = useMemo(() => renderWeekly(skills), [skills]);

  const favoriteItems = useMemo(() => {
    return skills
      .filter((skill) => favorites.includes(skill.id) && skill.is_active !== false)
      .filter((skill) => (favoritesGroupFilter === "all" ? true : (favoriteGroups[skill.id] || "favorites") === favoritesGroupFilter))
      .sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
  }, [skills, favorites, favoritesGroupFilter, favoriteGroups]);

  function toggleFavorite(skillId) {
    setFavorites((current) => {
      if (current.includes(skillId)) {
        const next = current.filter((id) => id !== skillId);
        setFavoriteGroups((groups) => {
          const clone = { ...groups };
          delete clone[skillId];
          return clone;
        });
        return next;
      }
      setFavoriteGroups((groups) => ({ ...groups, [skillId]: groups[skillId] || "favorites" }));
      return [...current, skillId];
    });
  }

  function updateFavoriteGroup(skillId, group) {
    setFavoriteGroups((current) => ({ ...current, [skillId]: group }));
  }

  return (
    <>
      <div className="orb orb-a"></div>
      <div className="orb orb-b"></div>
      <DocNav initialLang={lang} />

      <header className="hero">
        <div className="hero-content">
          <div className="brand">
            <img src="/assets/logo.svg" alt="AI Skills logo" className="logo" />
            <div className="brand-text">
              <p className="eyebrow">{copy.eyebrow}</p>
              <span className="brand-name">AI Skills Hub</span>
            </div>
          </div>
          <h1>{copy.heroTitle}</h1>
          <p className="hero-sub">{copy.heroSub}</p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => controlsRef.current?.scrollIntoView({ behavior: "smooth" })}>
              {copy.browse}
            </button>
            <button className="ghost" type="button" onClick={() => aboutRef.current?.scrollIntoView({ behavior: "smooth" })}>
              {copy.about}
            </button>
            <Link className="ghost link-btn" href={withLang("/skills-mechanism.html", lang)}>
              {copy.mechanism}
            </Link>
            <Link className="ghost link-btn" href={withLang("/mcp-protocol.html", lang)}>
              {copy.mcp}
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="stat-grid">
            <div className="stat stat-skills">
              <span className="stat-dot"></span>
              <span className="stat-label">{copy.statSkills}</span>
              <span className="stat-value mono">{skills.filter((s) => s.is_active !== false).length || "--"}</span>
            </div>
            <div className="stat stat-sources">
              <span className="stat-dot"></span>
              <span className="stat-label">{copy.statSources}</span>
              <span className="stat-value mono">{sources.length || "--"}</span>
            </div>
            <div className="stat stat-updated">
              <span className="stat-dot"></span>
              <span className="stat-label">{copy.statUpdated}</span>
              <span className="stat-value">{lastUpdated}</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="weekly">
          <div className="weekly-header">
            <h2>{copy.weeklySectionTitle}</h2>
          </div>
          <div className="weekly-grid">
            <article className="weekly-card">
              <h3>{copy.weeklyNewTitle}</h3>
              <ul>
                {weekly.newSkills.length ? weekly.newSkills.map((skill) => (
                  <li key={`new-${skill.id}`}>
                    <Link href={`/skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(lang)}`}>
                      {skillName(skill, lang)}
                    </Link>
                    <span className="weekly-date">{parseDate(skill.created_at)?.toISOString().slice(0, 10)}</span>
                  </li>
                )) : <li>{copy.noWeeklyItems}</li>}
              </ul>
            </article>
            <article className="weekly-card">
              <h3>{copy.weeklyUpdatedTitle}</h3>
              <ul>
                {weekly.updatedSkills.length ? weekly.updatedSkills.map((skill) => (
                  <li key={`updated-${skill.id}`}>
                    <Link href={`/skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(lang)}`}>
                      {skillName(skill, lang)}
                    </Link>
                    <span className="weekly-date">{parseDate(skill.updated_at)?.toISOString().slice(0, 10)}</span>
                  </li>
                )) : <li>{copy.noWeeklyItems}</li>}
              </ul>
            </article>
          </div>
        </section>

        <section className="controls" ref={controlsRef}>
          <div className="control">
            <label htmlFor="search">{copy.labelSearch}</label>
            <input
              id="search"
              list="search-suggestions"
              type="search"
              value={search}
              placeholder={copy.placeholderSearch}
              onChange={(event) => setSearch(event.target.value)}
            />
            <datalist id="search-suggestions">
              {searchSuggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
          <div className="control">
            <label htmlFor="category">{copy.labelCategory}</label>
            <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{copy.allCategories}</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {translateCategory(item, lang)}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label htmlFor="source">{copy.labelSource}</label>
            <select id="source" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">{copy.allSources}</option>
              {sourceOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label htmlFor="platform">{copy.labelPlatform}</label>
            <select id="platform" value={platform} onChange={(event) => setPlatform(event.target.value)}>
              <option value="">{copy.allPlatforms}</option>
              {platformOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label htmlFor="favorite">{copy.labelFavorite}</label>
            <select id="favorite" value={favoriteMode} onChange={(event) => setFavoriteMode(event.target.value)}>
              <option value="">{copy.allFavoriteModes}</option>
              <option value="favorites">{copy.favoritesOnly}</option>
            </select>
          </div>
          <div className="control">
            <label htmlFor="status">{copy.labelStatus}</label>
            <select id="status" value={statusMode} onChange={(event) => setStatusMode(event.target.value)}>
              <option value="active">{copy.allStatus}</option>
              <option value="all">{copy.includeInactive}</option>
            </select>
          </div>
        </section>

        <section className="favorites-panel">
          <div className="favorites-header">
            <h2>{copy.favoritesTitle}</h2>
            <div className="favorites-tools">
              <span>{favoriteItems.length}</span>
              <select value={favoritesGroupFilter} onChange={(event) => setFavoritesGroupFilter(event.target.value)}>
                <option value="all">{copy.groupAll}</option>
                <option value="favorites">{copy.groupFavorites}</option>
                <option value="work">{copy.groupWork}</option>
                <option value="research">{copy.groupResearch}</option>
              </select>
            </div>
          </div>
          {!favoriteItems.length ? <p className="favorites-empty">{copy.favoritesEmpty}</p> : null}
          <div className="favorites-grid">
            {favoriteItems.map((skill) => {
              const group = favoriteGroups[skill.id] || "favorites";
              const groupLabel = copy[`group${group[0].toUpperCase()}${group.slice(1)}`];
              return (
                <article className="favorite-item" key={`favorite-${skill.id}`}>
                  <h3>{skillName(skill, lang)}</h3>
                  <p>{`${skill.source_name} · ${(skill.platforms || []).join(" / ")} · ${groupLabel}`}</p>
                  <div className="favorite-actions">
                    <Link href={`/skill-detail.html?id=${encodeURIComponent(skill.id)}&lang=${encodeURIComponent(lang)}`}>
                      {copy.details}
                    </Link>
                    <a href={skill.detail_url || skill.source_url} target="_blank" rel="noreferrer">
                      {copy.view}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid">
          {!groupedSkills.length ? (
            <div className="loading-indicator is-done">{copy.noMatchingSkills}</div>
          ) : (
            groupedSkills.map(([categoryName, items]) => (
              <section className="category-section" key={categoryName}>
                <div className="category-header">
                  <h2>{translateCategory(categoryName, lang)}</h2>
                  <span className="category-count">{`${items.length} ${copy.categoryCount}`}</span>
                </div>
                <div className="category-grid">
                  {items.map((skill) => (
                    <HomeSkillCard
                      key={skill.id}
                      skill={skill}
                      lang={lang}
                      copy={copy}
                      isFavorite={favorites.includes(skill.id)}
                      favoriteGroup={favoriteGroups[skill.id] || "favorites"}
                      onToggleFavorite={toggleFavorite}
                      onChangeGroup={updateFavoriteGroup}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </section>

        <section className="about" ref={aboutRef}>
          <h2>{copy.aboutTitle}</h2>
          <p>{copy.aboutText}</p>
          <div className="about-actions">
            <Link className="ghost link-btn" href={withLang("/sources.html", lang)}>
              {copy.viewAllSources}
            </Link>
          </div>
          <div className="source-list">
            {sources.map((sourceItem) => (
              <div className="source-item" key={sourceItem.name}>
                <strong title={sourceItem.name}>{sourceItem.name}</strong>
                <span className="source-score">
                  {`${copy.sourceScore}: ${sourceQualityScore(skills, sourceItem.name)}`}
                </span>
                <p>{sourceDescMap[lang]?.[sourceItem.name] || sourceItem.description}</p>
                <Link
                  className="source-detail-link"
                  href={`/sources.html?source=${encodeURIComponent(sourceItem.name)}&lang=${encodeURIComponent(lang)}`}
                >
                  {lang === "zh" ? "查看来源详情" : "View source details"}
                </Link>
                <a
                  href={sourceItem.url || sourceItem.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-external-link"
                >
                  {sourceItem.url || sourceItem.source_url}
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>{copy.footer}</p>
      </footer>
    </>
  );
}
