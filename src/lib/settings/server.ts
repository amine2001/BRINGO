import { cookies } from "next/headers";

import {
  LANGUAGE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  resolveAppLanguage,
  resolveThemePreference,
  type AppLanguage,
  type ThemePreference,
} from "@/lib/settings/preferences";

export async function getCurrentAppLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  return resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
}

export async function getCurrentThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  return resolveThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
}
