import Script from "next/script";

import { normalizeLang } from "../_lib/i18n";
import SourcesPageClient from "./sources-page-client";

function buildMetadata(lang) {
  const zh = lang === "zh";
  const title = zh ? "数据来源 | AI Skills Hub" : "Data Sources | AI Skills Hub";
  const description = zh
    ? "查看 AI Skills Hub 的全部数据来源、质量分、活跃技能数与外部链接。"
    : "Browse all data sources powering AI Skills Hub with quality metrics, active skill counts, and direct links.";
  const keywords = zh ? "AI技能来源, 数据来源, skills目录" : "AI skills sources, data sources, skill directories";
  const ogDescription = zh ? "查看全部数据来源的质量、状态与活跃度。" : "Browse all data sources with quality metrics, active skill counts, and source links.";
  const twitterDescription = zh ? "在一个目录中对比来源质量分、状态和活跃技能数。" : "Compare source quality, status, and activity in one directory.";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://www.ai-skills.xyz/sources.html?lang=${lang}`,
      languages: {
        en: "https://www.ai-skills.xyz/sources.html?lang=en",
        "zh-CN": "https://www.ai-skills.xyz/sources.html?lang=zh",
        "x-default": "https://www.ai-skills.xyz/sources.html?lang=en",
      },
    },
    openGraph: {
      type: "website",
      title,
      description: ogDescription,
      url: `https://www.ai-skills.xyz/sources.html?lang=${lang}`,
      images: ["/assets/logo.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: twitterDescription,
      images: ["/assets/logo.svg"],
    },
  };
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return buildMetadata(normalizeLang(params?.lang));
}

export default async function SourcesPage({ searchParams }) {
  const params = await searchParams;
  const lang = normalizeLang(params?.lang);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI Skills Data Sources",
    description: "Directory of data sources used by AI Skills Hub.",
    url: `https://www.ai-skills.xyz/sources.html?lang=${lang}`,
  };

  return (
    <>
      <Script id="sources-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <SourcesPageClient initialLang={lang} />
    </>
  );
}
