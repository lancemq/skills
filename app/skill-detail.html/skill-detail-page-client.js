"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import DocNav from "../_components/doc-nav";
import { LANGUAGE_STORAGE_KEY, normalizeLang, withLang } from "../_lib/i18n";
import { loadSkillsData, parseDate, translateCategory } from "../_lib/skill-data";

const seoText = {
  en: {
    notFound: "Skill not found",
    back: "Back",
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
  },
  zh: {
    notFound: "未找到该技能",
    back: "返回",
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
  },
};

function buildUsageExample(skill, lang) {
  const name = lang === "zh" ? skill.name_zh || skill.name : skill.name;
  const tags = (skill.tags || []).map((item) => String(item).toLowerCase());
  const hasTag = (needle) => tags.some((item) => item.includes(needle));

  const byTag = [
    {
      match: () => hasTag("seo") || hasTag("content"),
      en: {
        scene: "Website content optimization",
        prompt: `Use "${name}" to review this article for SEO.\nTarget keyword: [keyword]\nArticle draft: [paste content]\nPlease return: title/meta rewrite, heading improvements, internal link suggestions, and top 5 actionable fixes.`,
      },
      zh: {
        scene: "网站内容优化",
        prompt: `请使用「${name}」审查这篇文章的 SEO。\n目标关键词：[关键词]\n文章草稿：[粘贴内容]\n请输出：标题/描述改写、标题结构优化、内链建议，以及最优先的 5 条修改项。`,
      },
    },
    {
      match: () => hasTag("ui") || hasTag("ux") || hasTag("design") || hasTag("frontend"),
      en: {
        scene: "Landing page redesign",
        prompt: `Use "${name}" to redesign this page.\nCurrent page goal: [goal]\nAudience: [target users]\nConstraints: mobile first, keep brand colors.\nPlease return: layout proposal, visual hierarchy, component list, and a first-pass implementation plan.`,
      },
      zh: {
        scene: "落地页改版",
        prompt: `请使用「${name}」重做这个页面。\n当前页面目标：[目标]\n受众：[目标用户]\n约束：移动端优先，保留品牌色。\n请输出：版式方案、信息层级、组件清单，以及首轮实现计划。`,
      },
    },
    {
      match: () => hasTag("research") || hasTag("notes"),
      en: {
        scene: "Research synthesis",
        prompt: `Use "${name}" to synthesize these materials.\nSources: [links/files]\nQuestion: [core question]\nPlease return: key findings, evidence table, open questions, and a concise executive summary.`,
      },
      zh: {
        scene: "研究资料归纳",
        prompt: `请使用「${name}」整理这批资料。\n来源：[链接/文件]\n核心问题：[问题]\n请输出：关键结论、证据表、待验证问题，以及一段管理层摘要。`,
      },
    },
  ];

  const matched = byTag.find((entry) => entry.match());
  const fallback = lang === "zh"
    ? {
        scene: "通用任务执行",
        prompt: `请使用「${name}」完成这个任务。\n目标：[你要达成什么]\n输入/上下文：[数据/文件/背景]\n约束：[时间/格式/质量要求]\n请输出：执行步骤、最终结果和验收清单。`,
      }
    : {
        scene: "General skill execution",
        prompt: `Use "${name}" for this task.\nGoal: [what you want]\nInput/context: [data/files/background]\nConstraints: [time/format/quality limits]\nPlease return: execution steps, final output, and validation checklist.`,
      };

  const payload = matched ? (lang === "zh" ? matched.zh : matched.en) : fallback;
  return lang === "zh"
    ? `场景：${payload.scene}\n\n你可以这样提问：\n${payload.prompt}`
    : `Scenario: ${payload.scene}\n\nTry this prompt:\n${payload.prompt}`;
}

function healthNode(skill, copy) {
  const verified = parseDate(skill.verified_at);
  const status =
    skill.link_status === "ok" ? (
      <span className="pill-ok">{copy.ok}</span>
    ) : skill.link_status === "bad" ? (
      <span className="pill-bad">{copy.bad}</span>
    ) : (
      copy.unknown
    );

  return verified ? (
    <>
      {status} {" · "} {verified.toISOString().slice(0, 10)}
    </>
  ) : (
    status
  );
}

function renderSimilar(skills, currentSkill) {
  const currentTags = new Set((currentSkill.tags || []).map((item) => String(item).toLowerCase()));
  return skills
    .filter((item) => item.id !== currentSkill.id && item.is_active !== false)
    .map((item) => {
      const tags = (item.tags || []).map((tag) => String(tag).toLowerCase());
      let score = 0;
      if (item.category && currentSkill.category && item.category === currentSkill.category) score += 3;
      if (item.source_name && currentSkill.source_name && item.source_name === currentSkill.source_name) score += 1;
      score += tags.filter((tag) => currentTags.has(tag)).length * 2;
      score += Math.min(Number(item.popularity) || 0, 100000) / 100000;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.item);
}

export default function SkillDetailPageClient({ initialLang }) {
  const searchParams = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang") || initialLang);
  const skillId = searchParams.get("id") || "";
  const copy = seoText[lang] || seoText.en;

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_error) {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const nextSkills = await loadSkillsData();
      if (!cancelled) {
        setSkills(Array.isArray(nextSkills) ? nextSkills : []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const skill = useMemo(() => skills.find((item) => item.id === skillId), [skills, skillId]);
  const related = useMemo(() => (skill ? renderSimilar(skills, skill) : []), [skill, skills]);

  const skillName = skill ? (lang === "zh" ? skill.name_zh || skill.name : skill.name) : "";
  const short = skill
    ? lang === "zh"
      ? skill.short_description_zh || skill.short_description
      : skill.short_description
    : "";
  const long = skill
    ? lang === "zh"
      ? skill.long_description_zh || skill.long_description
      : skill.long_description
    : "";

  return (
    <>
      <DocNav initialLang={lang} />
      <main className="detail-wrap">
        <article className="detail-card">
          <div className="detail-top">
            <div>
              <p className="eyebrow">{skill ? `${copy.source}: ${skill.source_name || "-"}` : copy.source}</p>
              <h1>{loading ? "Loading..." : skill ? skillName : copy.notFound}</h1>
              <p>{short}</p>
            </div>
            <div className="detail-actions">
              <Link className="ghost link-btn" href={withLang("/", lang)}>
                {copy.back}
              </Link>
              {skill ? (
                <a className="primary link-btn" href={skill.detail_url || skill.source_url || "#"} target="_blank" rel="noreferrer">
                  {copy.view}
                </a>
              ) : null}
            </div>
          </div>

          {skill ? (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>{copy.category}</strong>
                  <p>{translateCategory(skill.category, lang)}</p>
                </div>
                <div className="detail-item">
                  <strong>{copy.platforms}</strong>
                  <p>{(skill.platforms || []).join(" / ") || "-"}</p>
                </div>
                <div className="detail-item">
                  <strong>{copy.popularity}</strong>
                  <p>{skill.popularity ? `${skill.popularity}` : "Official/Curated"}</p>
                </div>
                <div className="detail-item">
                  <strong>{copy.health}</strong>
                  <p>{healthNode(skill, copy)}</p>
                </div>
              </div>

              <section className="detail-section">
                <h2>{copy.capability}</h2>
                <p>{long || "-"}</p>
              </section>

              <section className="detail-section">
                <h2>{copy.install}</h2>
                <pre>
                  <code>{`# Example\nmkdir -p $CODEX_HOME/skills/${skill.id}\n# copy SKILL.md into the folder`}</code>
                </pre>
              </section>

              <section className="detail-section">
                <h2>{copy.usage}</h2>
                <pre>
                  <code>{buildUsageExample(skill, lang)}</code>
                </pre>
              </section>

              <section className="detail-section">
                <h2>{copy.related}</h2>
                <div className="related-list">
                  {related.length ? (
                    related.map((item) => (
                      <article className="related-item" key={item.id}>
                        <Link href={`/skill-detail.html?id=${encodeURIComponent(item.id)}&lang=${encodeURIComponent(lang)}`}>
                          {lang === "zh" ? item.name_zh || item.name : item.name}
                        </Link>
                        <p>
                          {lang === "zh"
                            ? item.short_description_zh || item.short_description || ""
                            : item.short_description || ""}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p>{copy.noRelated}</p>
                  )}
                </div>
              </section>
            </>
          ) : loading ? null : null}
        </article>
      </main>
    </>
  );
}
