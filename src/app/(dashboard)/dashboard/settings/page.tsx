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

const PAGE_COPY = {
  en: {
    eyebrow: "Settings",
    title: "Adjust language and appearance",
    description:
      "Choose the dashboard language preference and switch between dark and light mode for the Bringo control tower.",
    currentTitle: "Current preferences",
    currentDescription: "These preferences are saved in your browser and applied across the dashboard.",
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
    saveLabel: "Save settings",
  },
  fr: {
    eyebrow: "Parametres",
    title: "Ajuster la langue et l'apparence",
    description:
      "Choisissez la langue du dashboard et basculez entre le mode sombre et clair.",
    currentTitle: "Preferences actuelles",
    currentDescription: "Ces preferences sont enregistrees dans votre navigateur.",
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
    saveLabel: "Enregistrer",
  },
  ar: {
    eyebrow: "الاعدادات",
    title: "تعديل اللغة والمظهر",
    description: "اختر لغة لوحة التحكم وغير بين الوضع الداكن والفاتح.",
    currentTitle: "الخيارات الحالية",
    currentDescription: "يتم حفظ هذه الخيارات في المتصفح وتطبيقها على كامل اللوحة.",
    languageLabel: "اللغة",
    directionLabel: "الاتجاه",
    themeLabel: "الثيم",
    languageSectionTitle: "اللغة",
    languageSectionDescription: "العربية تحول الواجهة تلقائيا الى من اليمين الى اليسار.",
    languagesCount: "4 لغات متاحة",
    themePanelTitle: "الثيم",
    themePanelDescription: "بدل مظهر لوحة التحكم كاملا بين الداكن والفاتح.",
    changesTitle: "ما الذي يتغير",
    changes: [
      "اللغة المختارة تحدث التنقل واتجاه الصفحة.",
      "العربية تفعّل وضع RTL تلقائيا.",
      "الثيم يغير كل البطاقات والاسطح والازرار.",
    ],
    saveLabel: "حفظ الاعدادات",
  },
  pt: {
    eyebrow: "Configuracoes",
    title: "Ajustar idioma e aparencia",
    description:
      "Escolha o idioma do dashboard e alterne entre o modo escuro e claro.",
    currentTitle: "Preferencias atuais",
    currentDescription: "Essas preferencias ficam salvas no navegador.",
    languageLabel: "Idioma",
    directionLabel: "Direcao",
    themeLabel: "Tema",
    languageSectionTitle: "Idioma",
    languageSectionDescription:
      "O arabe muda a interface automaticamente para leitura RTL.",
    languagesCount: "4 idiomas disponiveis",
    themePanelTitle: "Tema",
    themePanelDescription: "Troque todo o dashboard entre visual escuro e claro.",
    changesTitle: "O que muda agora",
    changes: [
      "O idioma escolhido atualiza a navegacao e a direcao da pagina.",
      "O arabe ativa RTL automaticamente.",
      "O tema muda cards, botoes e superficies do dashboard.",
    ],
    saveLabel: "Salvar configuracoes",
  },
} as const;

export default async function SettingsPage() {
  await requireCompanyContext();

  const cookieStore = await cookies();
  const language = resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const theme = resolveThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const direction = resolveLanguageDirection(language);
  const copy = PAGE_COPY[language];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <SectionCard title={copy.currentTitle} description={copy.currentDescription}>
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
        description={copy.languageSectionDescription}
        action={<StatusPill tone="info">{copy.languagesCount}</StatusPill>}
      >
        <form action={saveDashboardSettingsAction} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {LANGUAGE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="dashboard-subtle-card group cursor-pointer rounded-[24px] p-5 transition hover:border-[color:var(--dashboard-nav-active-border)] hover:bg-[color:var(--dashboard-nav-active-bg)]"
              >
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  defaultChecked={option.value === language}
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
            <div className="dashboard-soft-card rounded-[24px] p-5">
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.themePanelTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--dashboard-muted-text)]">
                {copy.themePanelDescription}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {THEME_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="dashboard-strong-card group cursor-pointer rounded-[22px] p-4 transition hover:border-[color:var(--dashboard-nav-active-border)] hover:bg-[color:var(--dashboard-nav-active-bg)]"
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

            <div className="dashboard-soft-card rounded-[24px] p-5">
              <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
                {copy.changesTitle}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--dashboard-body)]">
                {copy.changes.map((item) => (
                  <div
                    key={item}
                    className="dashboard-strong-card rounded-2xl px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="dashboard-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              {copy.saveLabel}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
