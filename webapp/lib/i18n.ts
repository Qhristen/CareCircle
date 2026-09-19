import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/translation.json";
import es from "@/locales/es/translation.json";
import fr from "@/locales/fr/translation.json";
import pt from "@/locales/pt/translation.json";

export const supportedLanguages = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "fr", label: "Français", shortLabel: "FR" },
  { code: "pt", label: "Português", shortLabel: "PT" },
  { code: "es", label: "Español", shortLabel: "ES" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];
export const LANGUAGE_STORAGE_KEY = "carecircle-language";

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const normalized = language?.toLowerCase().split("-")[0];
  return supportedLanguages.some(({ code }) => code === normalized)
    ? (normalized as SupportedLanguage)
    : "en";
}

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        pt: { translation: pt },
      },
      lng: "en",
      fallbackLng: "en",
      supportedLngs: supportedLanguages.map(({ code }) => code),
      load: "languageOnly",
      detection: {
        order: ["localStorage", "navigator"],
        caches: [],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
