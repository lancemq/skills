import Script from "next/script";

import { normalizeLang } from "../_lib/i18n";
import SkillDetailPageClient from "./skill-detail-page-client";

function buildMetadata(lang) {
  const zh = lang === "zh";
  const title = zh ? "Skill 详情 | AI Skills Hub" : "Skill Details | AI Skills Hub";
  const description = zh
    ? "查看技能详情，包括用途、安装方式、使用示例和来源链接。"
    : "Detailed AI skill profile with use cases, setup, input/output examples, and source links.";
  const keywords = zh
    ? "AI技能详情, Claude技能, Codex技能, 工作流提示词"
    : "AI skill detail, Claude skill, Codex skill, prompt workflow";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.ai-skills.xyz/skill-detail.html?lang=${lang}`,
      languages: {
        en: "https://www.ai-skills.xyz/skill-detail.html?lang=en",
        "zh-CN": "https://www.ai-skills.xyz/skill-detail.html?lang=zh",
        "x-default": "https://www.ai-skills.xyz/skill-detail.html?lang=en",
      },
    },
  };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return buildMetadata(normalizeLang(params?.lang));
}

export default async function SkillDetailPage({ searchParams }) {
  const params = await searchParams;
  const lang = normalizeLang(params?.lang);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "AI Skill Detail",
    description: "Detailed AI skill profile with use cases, setup, input/output examples, and source links.",
    url: `https://www.ai-skills.xyz/skill-detail.html?lang=${lang}`,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Skills Hub",
      url: "https://www.ai-skills.xyz/",
    },
  };

  return (
    <>
      <Script id="skill-detail-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <SkillDetailPageClient initialLang={lang} />
    </>
  );
}
