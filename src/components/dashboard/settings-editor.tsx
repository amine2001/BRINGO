"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  resolveLanguageDirection,
  type AppLanguage,
  type ThemePreference,
} from "@/lib/settings/preferences";

type SettingsEditorProps = {
  initialLanguage: AppLanguage;
  initialTheme: ThemePreference;
};

const PAGE_COPY = {
  en: {
    eyebrow: "Settings",
    title: "Adjust language and appearance",
    description:
      "Choose the dashboard language preference and switch between dark and light mode for the Bringo control tower.",
    currentTitle: "Current preferences",
    languageLabel: "Language",
    directionLabel: "Direction",
    themeLabel: "Theme",
    languageSectionTitle: "Language",
    languageSectionDescription:
      "Arabic switches the interface direction to right-to-left. The rest stay left-to-right.",
    languagesCount: "4 languages available",
    themePanelTitle: "Theme",
    themePanelDescription: "Switch the whole dashboard between dark and light mode.",
    changesTitle: "What changes now",
    changes: [
      "The selected language updates the dashboard navigation and page direction.",
      "Arabic flips the interface to right-to-left automatically.",
      "Theme changes the entire dashboard chrome, cards, and surfaces.",
    ],
    applyLabel: "Save settings",
    applyingLabel: "Applying...",
  },
  fr: {
    eyebrow: "Parametres",
    title: "Ajuster la langue et l'apparence",
    description:
      "Choisissez la langue du dashboard et basculez entre le mode sombre et clair.",
    currentTitle: "Preferences actuelles",
    languageLabel: "Langue",
    directionLabel: "Direction",
    themeLabel: "Theme",
    languageSectionTitle: "Langue",
    languageSectionDescription:
      "L'arabe passe l'interface en lecture de droite a gauche.",
    languagesCount: "4 langues disponibles",
    themePanelTitle: "Theme",
    themePanelDescription: "Changez tout le dashboard entre sombre et clair.",
    changesTitle: "Effets immediats",
    changes: [
      "La langue choisie met a jour la navigation et la direction.",
      "L'arabe active automatiquement le mode RTL.",
      "Le theme change les cartes, boutons et surfaces du dashboard.",
    ],
    applyLabel: "Enregistrer",
    applyingLabel: "Application...",
  },
  ar: {
    eyebrow: "Settings",
    title: "Adjust language and appearance",
    description: "Choose the dashboard language and switch between dark and light mode.",
    currentTitle: "Current preferences",
    languageLabel: "Language",
    directionLabel: "Direction",
    themeLabel: "Theme",
    languageSectionTitle: "Language",
    languageSectionDescription: "Arabic switches the interface to right-to-left.",
    languagesCount: "4 languages available",
    themePanelTitle: "Theme",
    themePanelDescription: "Switch the whole dashboard between dark and light mode.",
    changesTitle: "What changes now",
    changes: [
      "The selected language updates page direction after refresh.",
      "Arabic activates RTL automatically.",
      "Theme changes the full dashboard look instantly.",
    ],
    applyLabel: "Save settings",
    applyingLabel: "Applying...",
  },
  pt: {
    eyebrow: "Configuracoes",
    title: "Ajustar idioma e aparencia",
    description:
      "Escolha o idioma do dashboard e alterne entre o modo escuro e claro.",
    currentTitle: "Preferencias atuais",
    languageLabel: "Idioma",
    directionLabel: "Direcao",
    themeLabel: "Tema",
    languageSectionTitle: "Idioma",
    languageSectionDescription:
      "Arabic switches the interface to right-to-left. The others stay left-to-right.",
    languagesCount: "4 idiomas disponiveis",
    themePanelTitle: "Tema",
    themePanelDescription: "Troque todo o dashboard entre visual escuro e claro.",
    changesTitle: "O que muda agora",
    changes: [
      "O idioma escolhido atualiza a navegacao e a direcao da pagina.",
      "Arabic ativa RTL automaticamente.",
      "O tema muda cards, botoes e superficies do dashboard.",
    ],
    applyLabel: "Salvar configuracoes",
    applyingLabel: "Aplicando...",
  },
} as const satisfies Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    currentTitle: string;
    languageLabel: string;
    directionLabel: string;
    themeLabel: string;
    languageSectionTitle: string;
    languageSectionDescription: string;
    languagesCount: string;
    themePanelTitle: string;
    themePanelDescription: string;
    changesTitle: string;
    changes: string[];
    applyLabel: string;
    applyingLabel: string;
  }
>;

function buildFormData(language: AppLanguage, theme: ThemePreference) {
  const formData = new FormData();
  formData.set("language", language);
  formData.set("theme", theme);
  return formData;
}

export function SettingsEditor({
  initialLanguage,
  initialTheme,
}: SettingsEditorProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [isPending, startTransition] = useTransition();
  const copy = PAGE_COPY[language];
  const direction = resolveLanguageDirection(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.theme = theme;
  }, [direction, language, theme]);

  function persistSettings(nextLanguage: AppLanguage, nextTheme: ThemePreference) {
    startTransition(async () => {
      await saveDashboardSettingsAction(buildFormData(nextLanguage, nextTheme));
      router.refresh();
    });
  }

  function handleLanguageChange(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    persistSettings(nextLanguage, theme);
  }

  function handleThemeChange(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    persistSettings(language, nextTheme);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    persistSettings(language, theme);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <SectionCard title={copy.currentTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <div className="flex items-center gap-3 text-[color:var(--dashboard-eyebrow)]">
              <FontAwesomeIcon icon={faLanguage} className="text-sm" />
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.languageLabel}
              </p>
            </div>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {LANGUAGE_OPTIONS.find((option) => option.value === language)?.label}
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <div className="flex items-center gap-3 text-[color:var(--dashboard-eyebrow)]">
              <FontAwesomeIcon icon={faGlobe} className="text-sm" />
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.directionLabel}
              </p>
            </div>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {direction === "rtl" ? "RTL" : "LTR"}
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <div className="flex items-center gap-3 text-[color:var(--dashboard-eyebrow)]">
              <FontAwesomeIcon icon={theme === "dark" ? faMoon : faSun} className="text-sm" />
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.themeLabel}
              </p>
            </div>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {THEME_OPTIONS.find((option) => option.value === theme)?.label}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={copy.languageSectionTitle}
        action={<StatusPill tone="info">{copy.languagesCount}</StatusPill>}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = option.value === language;

              return (
                <label
                  key={option.value}
                  className={[
                    "dashboard-subtle-card group cursor-pointer rounded-[24px] p-5 transition",
                    selected
                      ? "border-[color:var(--dashboard-nav-active-border)] bg-[color:var(--dashboard-nav-active-bg)]"
                      : "hover:border-[color:var(--dashboard-nav-active-border)] hover:bg-[color:var(--dashboard-nav-active-bg)]",
                    isPending ? "pointer-events-none opacity-70" : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="language"
                    value={option.value}
                    checked={selected}
                    onChange={() => handleLanguageChange(option.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-[color:var(--dashboard-eyebrow)]">
                        <FontAwesomeIcon icon={faLanguage} />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[color:var(--dashboard-heading)]">
                          {option.label}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--dashboard-muted-text)]">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full border transition",
                        selected
                          ? "border-emerald-300/30 bg-emerald-400/14 text-emerald-100"
                          : "border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-transparent",
                      ].join(" ")}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="dashboard-soft-card rounded-[24px] p-5">
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.themePanelTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--dashboard-muted-text)]">
                {copy.themePanelDescription}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {THEME_OPTIONS.map((option) => {
                  const selected = option.value === theme;

                  return (
                    <label
                      key={option.value}
                      className={[
                        "dashboard-strong-card group cursor-pointer rounded-[22px] p-4 transition",
                        selected
                          ? "border-[color:var(--dashboard-nav-active-border)] bg-[color:var(--dashboard-nav-active-bg)]"
                          : "hover:border-[color:var(--dashboard-nav-active-border)] hover:bg-[color:var(--dashboard-nav-active-bg)]",
                        isPending ? "pointer-events-none opacity-70" : "",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={selected}
                        onChange={() => handleThemeChange(option.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-[color:var(--dashboard-eyebrow)]">
                            <FontAwesomeIcon icon={option.value === "dark" ? faMoon : faSun} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--dashboard-heading)]">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-[color:var(--dashboard-muted-text)]">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <span
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-full border transition",
                            selected
                              ? "border-emerald-300/30 bg-emerald-400/14 text-emerald-100"
                              : "border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-transparent",
                          ].join(" ")}
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="dashboard-soft-card rounded-[24px] p-5">
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.changesTitle}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--dashboard-body)]">
                {copy.changes.map((item) => (
                  <div key={item} className="dashboard-strong-card rounded-2xl px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="dashboard-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? copy.applyingLabel : copy.applyLabel}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
