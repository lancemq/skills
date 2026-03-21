"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LANGUAGE_STORAGE_KEY, withLang } from "../_lib/i18n";

const NAV_I18N = {
  en: {
    home: "Home",
    how: "How Skills Work",
    mcp: "MCP Guide",
    sources: "Sources",
    lang: "EN / ZH",
  },
  zh: {
    home: "首页",
    how: "Skills 原理与作用",
    mcp: "MCP 说明",
    sources: "数据来源",
    lang: "EN / 中文",
  },
};

export default function DocNav({ initialLang }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState(initialLang);
  const dict = NAV_I18N[lang] || NAV_I18N.en;

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_error) {
      // ignore storage failures
    }
  }, [lang]);

  useEffect(() => {
    const queryLang = searchParams.get("lang");
    if (queryLang === "en" || queryLang === "zh") {
      if (queryLang !== lang) {
        setLang(queryLang);
      }
      return;
    }

    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if ((saved === "en" || saved === "zh") && saved !== lang) {
        setLang(saved);
        router.replace(withLang(pathname, saved), { scroll: false });
      }
    } catch (_error) {
      // ignore storage failures
    }
  }, [lang, pathname, router, searchParams]);

  function toggleLang() {
    const nextLang = lang === "zh" ? "en" : "zh";
    setLang(nextLang);
    router.replace(withLang(pathname, nextLang), { scroll: false });
  }

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <Link className="top-nav-brand" href={withLang("/", lang)}>
          <img src="/assets/logo.svg" alt="AI Skills logo" className="top-nav-logo" />
          <span>AI Skills Hub</span>
        </Link>
        <div className="top-nav-links">
          <Link href={withLang("/", lang)}>{dict.home}</Link>
          <Link href={withLang("/skills-mechanism.html", lang)}>{dict.how}</Link>
          <Link href={withLang("/mcp-protocol.html", lang)}>{dict.mcp}</Link>
          <Link href={withLang("/sources.html", lang)}>{dict.sources}</Link>
          <button className="ghost top-nav-lang" type="button" onClick={toggleLang}>
            {dict.lang}
          </button>
        </div>
      </div>
    </nav>
  );
}
