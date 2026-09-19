"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { normalizeLanguage } from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const detected = i18n.services.languageDetector?.detect?.();
    const detectedLanguage = Array.isArray(detected) ? detected[0] : detected;
    const initialLanguage = normalizeLanguage(detectedLanguage);

    const updateDocumentLanguage = (language: string) => {
      document.documentElement.lang = normalizeLanguage(language);
    };

    updateDocumentLanguage(initialLanguage);
    if (i18n.resolvedLanguage !== initialLanguage) {
      void i18n.changeLanguage(initialLanguage);
    }

    i18n.on("languageChanged", updateDocumentLanguage);
    return () => {
      i18n.off("languageChanged", updateDocumentLanguage);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
