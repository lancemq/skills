import Link from "next/link";

import DocNav from "./doc-nav";

function withLang(path, lang) {
  return `${path}?lang=${encodeURIComponent(lang)}`;
}

export default function DocShell({
  lang,
  eyebrow,
  brandName,
  title,
  subtitle,
  actions = [],
  children,
}) {
  return (
    <>
      <DocNav initialLang={lang} />
      <div className="doc-wrap">
        <div className="doc-card">
          <div className="brand">
            <img src="/assets/logo.svg" alt="AI Skills logo" className="logo" />
            <div className="brand-text">
              <p className="eyebrow">{eyebrow}</p>
              <span className="brand-name">{brandName}</span>
            </div>
          </div>
          <h1 className="doc-title">{title}</h1>
          <p className="doc-sub">{subtitle}</p>
          {actions.length > 0 ? (
            <div className="doc-actions">
              {actions.map((action) =>
                action.external ? (
                  <a
                    key={action.label}
                    className="ghost link-btn"
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {action.label}
                  </a>
                ) : (
                  <Link
                    key={action.label}
                    className="ghost link-btn"
                    href={withLang(action.href, lang)}
                  >
                    {action.label}
                  </Link>
                )
              )}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </>
  );
}
