import { cookies } from "next/headers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faGlobe,
  faLanguage,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveDashboardSettingsAction } from "@/lib/dashboard/actions";
import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_OPTIONS,
  THEME_COOKIE_NAME,
  THEME_OPTIONS,
  resolveAppLanguage,
  resolveLanguageDirection,
  resolveThemePreference,
} from "@/lib/settings/preferences";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function SettingsPage() {
  await requireCompanyContext();

  const cookieStore = await cookies();
  const language = resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const theme = resolveThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const direction = resolveLanguageDirection(language);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Adjust language and appearance"
        description="Choose the dashboard language preference and switch between dark and light mode for the Bringo control tower."
      />

      <SectionCard
        title="Current preferences"
        description="These preferences are saved in your browser and applied across the dashboard."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-3 text-cyan-100">
              <FontAwesomeIcon icon={faLanguage} className="text-sm" />
              <p className="text-sm font-medium text-white">Language</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {LANGUAGE_OPTIONS.find((option) => option.value === language)?.label}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-3 text-cyan-100">
              <FontAwesomeIcon icon={faGlobe} className="text-sm" />
              <p className="text-sm font-medium text-white">Direction</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {direction === "rtl" ? "RTL" : "LTR"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <div className="flex items-center gap-3 text-cyan-100">
              <FontAwesomeIcon icon={theme === "dark" ? faMoon : faSun} className="text-sm" />
              <p className="text-sm font-medium text-white">Theme</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {THEME_OPTIONS.find((option) => option.value === theme)?.label}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Language"
        description="Arabic switches the interface direction to right-to-left. The rest stay left-to-right."
        action={<StatusPill tone="info">4 languages available</StatusPill>}
      >
        <form action={saveDashboardSettingsAction} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {LANGUAGE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="group cursor-pointer rounded-[24px] border border-white/10 bg-white/4 p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/6"
              >
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  defaultChecked={option.value === language}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-cyan-100">
                        <FontAwesomeIcon icon={faLanguage} />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-white">{option.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{option.description}</p>
                      </div>
                    </div>
                  </div>
                  {option.value === language ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/14 text-emerald-100">
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  ) : null}
                </div>
              </label>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
              <p className="text-sm font-medium text-white">Theme</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Switch the whole dashboard between dark and light mode.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {THEME_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="group cursor-pointer rounded-[22px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/6"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={option.value}
                      defaultChecked={option.value === theme}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-cyan-100">
                          <FontAwesomeIcon icon={option.value === "dark" ? faMoon : faSun} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{option.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{option.description}</p>
                        </div>
                      </div>
                      {option.value === theme ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/14 text-emerald-100">
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        </span>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
              <p className="text-sm font-medium text-white">What changes now</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                  Language preference is saved for this browser session profile.
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                  Arabic uses right-to-left layout direction automatically.
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                  Theme switches the full dashboard between dark and light look.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save settings
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
