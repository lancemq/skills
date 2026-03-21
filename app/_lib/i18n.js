export const LANGUAGE_STORAGE_KEY = "ai_skills_lang_v1";

export function normalizeLang(value) {
  return value === "zh" ? "zh" : "en";
}

export function withLang(path, lang) {
  return `${path}?lang=${encodeURIComponent(lang)}`;
}
