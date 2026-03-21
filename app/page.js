import Script from "next/script";

import HomePageClient from "./home-page-client";
import { normalizeLang } from "./_lib/i18n";

function buildMetadata(lang) {
  const zh = lang === "zh";
  const title = zh ? "AI Skills Hub | 热门 AI Skills 导航与对比" : "AI Skills Hub | Discover and Compare AI Skills";
  const description = zh
    ? "收录并对比热门 AI Skills，支持按分类、来源与平台筛选，帮助你快速找到可用技能。"
    : "Discover, filter, and compare curated AI skills from multiple sources. Explore thousands of skills across development, design, productivity, and more.";
  const keywords = zh
    ? "AI技能, Claude技能, Codex技能, 智能体技能, 工作流技能, 开发工具"
    : "AI skills, Claude skills, Codex skills, skill marketplace, AI workflow, developer tools";

  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: `https://www.ai-skills.xyz/?lang=${lang}`,
      languages: {
        en: "https://www.ai-skills.xyz/?lang=en",
        "zh-CN": "https://www.ai-skills.xyz/?lang=zh",
        "x-default": "https://www.ai-skills.xyz/?lang=en",
      },
    },
    openGraph: {
      type: "website",
      title,
      description: zh
        ? "一个可搜索的 AI Skills 目录，提供来源链接、分类筛选与平台对比。"
        : "A searchable directory of curated AI skills with source links, categories, and platform filters.",
      url: `https://www.ai-skills.xyz/?lang=${lang}`,
      locale: zh ? "zh_CN" : "en_US",
      images: ["/assets/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: zh
        ? "浏览来自社区与目录站点的 AI Skills，快速筛选并查看详情。"
        : "Browse curated AI skills from multiple communities and marketplaces.",
      images: ["/assets/logo.svg"],
    },
  };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return buildMetadata(normalizeLang(params?.lang));
}

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const lang = normalizeLang(params?.lang);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Skills Hub",
    url: "https://www.ai-skills.xyz/",
    description: "A searchable directory of curated AI skills from multiple public sources.",
  };
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Skills Hub",
    url: `https://www.ai-skills.xyz/?lang=${lang}`,
    description: "Explore and compare AI skills by category, source, and platform.",
  };

  return (
    <>
      <Script id="website-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(websiteJsonLd)}
      </Script>
      <Script id="collection-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(collectionJsonLd)}
      </Script>
      <HomePageClient initialLang={lang} />
    </>
  );
}
