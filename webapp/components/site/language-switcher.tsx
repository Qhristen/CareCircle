"use client";

import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, supportedLanguages } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage);

  return (
    <label className="inline-flex items-center gap-2">
      <span className={compact ? "sr-only" : "text-xs font-bold text-on-surface-variant"}>
        {t("language.label")}
      </span>
      <select
        aria-label={t("language.selectLabel")}
        className="h-10 cursor-pointer rounded-full bg-surface-container px-3 text-xs font-extrabold text-on-surface outline-none ring-primary/20 transition hover:bg-surface-container-high focus:ring-4"
        onChange={(event) => {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, event.target.value);
          void i18n.changeLanguage(event.target.value);
        }}
        value={language}
      >
        {supportedLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.shortLabel : item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
