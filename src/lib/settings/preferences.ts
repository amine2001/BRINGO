export const LANGUAGE_COOKIE_NAME = "bringo-language";
export const THEME_COOKIE_NAME = "bringo-theme";

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", description: "Default dashboard language", direction: "ltr" },
  { value: "fr", label: "French", description: "Français", direction: "ltr" },
  { value: "ar", label: "Arabic", description: "العربية", direction: "rtl" },
  { value: "pt", label: "Portuguese", description: "Português", direction: "ltr" },
] as const;

export const THEME_OPTIONS = [
  { value: "dark", label: "Dark", description: "Current control tower look" },
  { value: "light", label: "Light", description: "Bright daytime dashboard" },
] as const;

export type AppLanguage = (typeof LANGUAGE_OPTIONS)[number]["value"];
export type ThemePreference = (typeof THEME_OPTIONS)[number]["value"];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return LANGUAGE_OPTIONS.some((option) => option.value === value);
}

export function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return THEME_OPTIONS.some((option) => option.value === value);
}

export function resolveAppLanguage(value: string | null | undefined): AppLanguage {
  return isAppLanguage(value) ? value : "en";
}

export function resolveThemePreference(
  value: string | null | undefined,
): ThemePreference {
  return isThemePreference(value) ? value : "dark";
}

export function resolveLanguageDirection(language: AppLanguage) {
  return language === "ar" ? "rtl" : "ltr";
}
