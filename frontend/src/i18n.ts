import { useSyncExternalStore } from "react";
import { english } from "./locales/en";
export type Language = "fr" | "en";
function savedLanguage(): Language {
  try {
    return localStorage.getItem("mymangatracker_language") === "en"
      ? "en"
      : "fr";
  } catch {
    return "fr";
  }
}
let language: Language = savedLanguage();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useLanguage() {
  return useSyncExternalStore(subscribe, () => language);
}
export function setLanguage(value: Language) {
  language = value;
  try {
    localStorage.setItem("mymangatracker_language", value);
  } catch {
    /* Private browsing may disable storage. */
  }
  document.documentElement.lang = value;
  listeners.forEach((listener) => listener());
}
export function locale() {
  return language === "fr" ? "fr-FR" : "en-GB";
}
export function t(text: string, values: Record<string, string | number> = {}) {
  const translated = language === "en" ? (english[text] ?? text) : text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    String(values[key] ?? match),
  );
}
document.documentElement.lang = language;

const frenchGenres: Record<string, string> = {
  Adventure: "Aventure",
  Comedy: "Comédie",
  Drama: "Drame",
  Fantasy: "Fantastique",
  Horror: "Horreur",
  Mystery: "Mystère",
  Psychological: "Psychologique",
  "Sci-Fi": "Science-fiction",
  "Slice of Life": "Tranche de vie",
  Supernatural: "Surnaturel",
};
export function genreLabel(genre: string) {
  return language === "fr" ? (frenchGenres[genre] ?? genre) : genre;
}
