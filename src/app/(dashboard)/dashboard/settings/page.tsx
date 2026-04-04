import { cookies } from "next/headers";

import { SettingsEditor } from "@/components/dashboard/settings-editor";
import {
  LANGUAGE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  resolveAppLanguage,
  resolveThemePreference,
} from "@/lib/settings/preferences";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function SettingsPage() {
  await requireCompanyContext();

  const cookieStore = await cookies();
  const language = resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const theme = resolveThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <SettingsEditor
      key={`${language}-${theme}`}
      initialLanguage={language}
      initialTheme={theme}
    />
  );
}
