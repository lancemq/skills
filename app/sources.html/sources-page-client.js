"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import DocNav from "../_components/doc-nav";
import { LANGUAGE_STORAGE_KEY, normalizeLang, withLang } from "../_lib/i18n";
import {
  loadSkillsData,
  loadSourcesData,
  normalize,
  parseDate,
  qualityScore,
} from "../_lib/skill-data";

const i18n = {
  en: {
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
  },
  zh: {
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
  },
};

function buildStatus(row) {
  if (!row.totalSkills) return "none";
  if (row.unhealthyLinks === 0 && row.healthyLinks > 0) return "healthy";
  if (row.healthyLinks > 0 && row.unhealthyLinks > 0) return "mixed";
  return "issues";
}

function buildRows(sources, skills) {
  const bySource = skills.reduce((acc, skill) => {
    const sourceName = skill.source_name || "";
    if (!sourceName) return acc;
    if (!acc[sourceName]) acc[sourceName] = [];
    acc[sourceName].push(skill);
    return acc;
  }, {});

  return sources.map((source) => {
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
}

export default function SourcesPageClient({ initialLang }) {
  const searchParams = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang") || initialLang);
  const copy = i18n[lang] || i18n.en;
  const focusedSource = searchParams.get("source") || "";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState(focusedSource);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("quality");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_error) {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    setSearch(focusedSource);
  }, [focusedSource]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [sources, skills] = await Promise.all([loadSourcesData(), loadSkillsData()]);
      if (!cancelled) {
        setRows(buildRows(sources, Array.isArray(skills) ? skills : []));
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(
    () => Array.from(new Set(rows.map((item) => item.type).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const next = rows.filter((row) => {
      const matchesSearch =
        !search ||
        [row.name, row.description, row.url, row.type].some((item) => normalize(item).includes(normalize(search)));
      const matchesType = !type || row.type === type;
      const matchesStatus = !status || buildStatus(row) === status;
      return matchesSearch && matchesType && matchesStatus;
    });

    next.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "en");
      if (sort === "active") return b.activeSkills - a.activeSkills;
      if (sort === "verified") return (parseDate(b.lastVerified)?.getTime() || 0) - (parseDate(a.lastVerified)?.getTime() || 0);
      return b.quality - a.quality;
    });

    return next;
  }, [rows, search, type, status, sort]);

  return (
    <>
      <DocNav initialLang={lang} />
      <main className="source-directory-wrap">
        <section className="source-directory-header">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className="source-directory-controls">
            <div className="control">
              <label htmlFor="sources-search">{copy.searchLabel}</label>
              <input
                id="sources-search"
                type="search"
                value={search}
                placeholder={copy.searchPlaceholder}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="control">
              <label htmlFor="sources-type">{copy.typeLabel}</label>
              <select id="sources-type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">{copy.typeAll}</option>
                {types.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="control">
              <label htmlFor="sources-status">{copy.statusLabel}</label>
              <select id="sources-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">{copy.statusAll}</option>
                <option value="healthy">{copy.statusHealthy}</option>
                <option value="mixed">{copy.statusMixed}</option>
                <option value="issues">{copy.statusIssue}</option>
                <option value="none">{copy.statusNoSkills}</option>
              </select>
            </div>
            <div className="control">
              <label htmlFor="sources-sort">{copy.sortLabel}</label>
              <select id="sources-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="quality">{copy.sortQuality}</option>
                <option value="active">{copy.sortActive}</option>
                <option value="verified">{copy.sortVerified}</option>
                <option value="name">{copy.sortName}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="source-directory-grid">
          {filtered.map((row) => (
            <article
              key={row.name}
              className={`source-directory-card${focusedSource && row.name === focusedSource ? " source-directory-card--focus" : ""}`}
            >
              <span className="source-directory-type">{row.type || "-"}</span>
              <h2 title={row.name}>{row.name}</h2>
              <p className="source-directory-desc">{row.description || ""}</p>
              <div className="source-directory-metrics">
                <div className="source-directory-metric">
                  <strong>{copy.metricTotal}</strong>
                  <span>{row.totalSkills}</span>
                </div>
                <div className="source-directory-metric">
                  <strong>{copy.metricActive}</strong>
                  <span>{row.activeSkills}</span>
                </div>
                <div className="source-directory-metric">
                  <strong>{copy.metricHealth}</strong>
                  <span>{`${row.healthyLinks}/${row.totalSkills || 0}`}</span>
                </div>
                <div className="source-directory-metric">
                  <strong>{copy.metricVerified}</strong>
                  <span>{row.lastVerified || copy.noVerified}</span>
                </div>
              </div>
              <div className="source-directory-actions">
                <a href={row.url} target="_blank" rel="noreferrer">
                  {copy.openSource}
                </a>
                <Link href={withLang("/", lang)}>{copy.browseSkills}</Link>
              </div>
            </article>
          ))}
        </section>

        {!loading && filtered.length === 0 ? (
          <div className="source-directory-empty">{copy.noMatches}</div>
        ) : null}
      </main>
    </>
  );
}
