import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveApiConfigAction } from "@/lib/dashboard/actions";
import { getApiConfigPageData } from "@/lib/dashboard/queries";
import { getDateFnsLocale } from "@/lib/settings/date-locale";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    healthTitle: string;
    healthDescription: string;
    currentState: string;
    configured: string;
    missingConfig: string;
    lastSync: string;
    noSyncYet: string;
    responseFormat: string;
    pollingInterval: string;
    seconds: string;
    settingsTitle: string;
    settingsDescription: string;
    apiUrlLabel: string;
    apiUrlPlaceholder: string;
    apiKeyLabel: string;
    apiKeyPlaceholderKeep: string;
    apiKeyPlaceholderPaste: string;
    responseFormatLabel: string;
    pollingIntervalLabel: string;
    saveLabel: string;
  }
> = {
  en: {
    eyebrow: "API Config",
    title: "Configure Redash ingestion without exposing secrets",
    description:
      "This page models the operational inputs for the Redash API URL, API key management, polling cadence, and parser expectations.",
    healthTitle: "Connection health",
    healthDescription:
      "Operators need a quick snapshot of the current ingestion posture before changing credentials.",
    currentState: "Current state",
    configured: "Configured",
    missingConfig: "Missing config",
    lastSync: "Last successful sync",
    noSyncYet: "No sync yet",
    responseFormat: "Response format",
    pollingInterval: "Polling interval",
    seconds: "seconds",
    settingsTitle: "Redash connection settings",
    settingsDescription:
      "Fields are arranged to match the future secure config flow: URL, API key, response format, and polling cadence.",
    apiUrlLabel: "Redash API URL",
    apiUrlPlaceholder: "https://redash.example.com/api/queries/42/results.json",
    apiKeyLabel: "API key",
    apiKeyPlaceholderKeep: "Leave blank to keep current key",
    apiKeyPlaceholderPaste: "Paste the Redash API key",
    responseFormatLabel: "Response format",
    pollingIntervalLabel: "Polling interval (seconds)",
    saveLabel: "Save API configuration",
  },
  fr: {
    eyebrow: "API",
    title: "Configurer l'ingestion Redash sans exposer les secrets",
    description:
      "Cette page regroupe l'URL API Redash, la cle API, la cadence de polling et le format de reponse attendu.",
    healthTitle: "Sante de la connexion",
    healthDescription:
      "Les operateurs ont besoin d'un apercu rapide de l'etat actuel avant de modifier les identifiants.",
    currentState: "Etat actuel",
    configured: "Configure",
    missingConfig: "Configuration manquante",
    lastSync: "Derniere synchro reussie",
    noSyncYet: "Aucune synchro",
    responseFormat: "Format de reponse",
    pollingInterval: "Intervalle de polling",
    seconds: "secondes",
    settingsTitle: "Parametres de connexion Redash",
    settingsDescription:
      "Les champs suivent le flux de configuration securise : URL, cle API, format de reponse et cadence de polling.",
    apiUrlLabel: "URL API Redash",
    apiUrlPlaceholder: "https://redash.example.com/api/queries/42/results.json",
    apiKeyLabel: "Cle API",
    apiKeyPlaceholderKeep: "Laisser vide pour conserver la cle actuelle",
    apiKeyPlaceholderPaste: "Coller la cle API Redash",
    responseFormatLabel: "Format de reponse",
    pollingIntervalLabel: "Intervalle de polling (secondes)",
    saveLabel: "Enregistrer la configuration API",
  },
  ar: {
    eyebrow: "API",
    title: "ضبط ربط Redash بدون كشف الأسرار",
    description:
      "تجمع هذه الصفحة عنوان API الخاص بـ Redash ومفتاح API وتواتر السحب وصيغة الاستجابة المتوقعة.",
    healthTitle: "حالة الاتصال",
    healthDescription:
      "يحتاج المشغلون إلى نظرة سريعة على وضع الربط الحالي قبل تغيير بيانات الاعتماد.",
    currentState: "الحالة الحالية",
    configured: "تم الإعداد",
    missingConfig: "الإعداد مفقود",
    lastSync: "آخر مزامنة ناجحة",
    noSyncYet: "لا توجد مزامنة بعد",
    responseFormat: "صيغة الاستجابة",
    pollingInterval: "فاصل السحب",
    seconds: "ثانية",
    settingsTitle: "إعدادات اتصال Redash",
    settingsDescription:
      "ترتيب الحقول يتبع مسار الإعداد الآمن: الرابط، مفتاح API، صيغة الاستجابة، وفاصل السحب.",
    apiUrlLabel: "رابط Redash API",
    apiUrlPlaceholder: "https://redash.example.com/api/queries/42/results.json",
    apiKeyLabel: "مفتاح API",
    apiKeyPlaceholderKeep: "اتركه فارغاً للاحتفاظ بالمفتاح الحالي",
    apiKeyPlaceholderPaste: "ألصق مفتاح Redash API",
    responseFormatLabel: "صيغة الاستجابة",
    pollingIntervalLabel: "فاصل السحب (بالثواني)",
    saveLabel: "حفظ إعدادات API",
  },
  pt: {
    eyebrow: "API",
    title: "Configurar a ingestao do Redash sem expor segredos",
    description:
      "Esta pagina reune a URL da API do Redash, a chave da API, a cadencia de polling e o formato de resposta esperado.",
    healthTitle: "Saude da conexao",
    healthDescription:
      "Os operadores precisam de uma visao rapida do estado atual antes de alterar as credenciais.",
    currentState: "Estado atual",
    configured: "Configurado",
    missingConfig: "Configuracao ausente",
    lastSync: "Ultima sincronizacao bem-sucedida",
    noSyncYet: "Sem sincronizacao ainda",
    responseFormat: "Formato de resposta",
    pollingInterval: "Intervalo de polling",
    seconds: "segundos",
    settingsTitle: "Configuracoes de conexao do Redash",
    settingsDescription:
      "Os campos seguem o fluxo de configuracao segura: URL, chave da API, formato de resposta e cadencia de polling.",
    apiUrlLabel: "URL da API do Redash",
    apiUrlPlaceholder: "https://redash.example.com/api/queries/42/results.json",
    apiKeyLabel: "Chave da API",
    apiKeyPlaceholderKeep: "Deixe em branco para manter a chave atual",
    apiKeyPlaceholderPaste: "Cole a chave da API do Redash",
    responseFormatLabel: "Formato de resposta",
    pollingIntervalLabel: "Intervalo de polling (segundos)",
    saveLabel: "Salvar configuracao da API",
  },
};

export default async function ApiConfigPage() {
  const context = await requireCompanyContext();
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const dateLocale = getDateFnsLocale(language);
  const data = await getApiConfigPageData(context.company.id);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      <SectionCard title={copy.healthTitle} description={copy.healthDescription}>
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">{copy.currentState}</p>
            <div className="mt-3">
              <StatusPill tone={data.config ? "good" : "warn"}>
                {data.config ? copy.configured : copy.missingConfig}
              </StatusPill>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">{copy.lastSync}</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.lastSyncedAt
                ? formatDistanceToNow(data.lastSyncedAt, { addSuffix: true, locale: dateLocale })
                : copy.noSyncYet}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">{copy.responseFormat}</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.config?.responseFormat?.toUpperCase() ?? "AUTO"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">{copy.pollingInterval}</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.config?.pollIntervalSeconds ?? 60} {copy.seconds}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={copy.settingsTitle} description={copy.settingsDescription}>
        <form action={saveApiConfigAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span className="block font-medium text-white">{copy.apiUrlLabel}</span>
            <input
              name="redashApiUrl"
              type="url"
              defaultValue={data.config?.redashApiUrl ?? ""}
              placeholder={copy.apiUrlPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.apiKeyLabel}</span>
            <input
              name="redashApiKey"
              type="password"
              placeholder={data.config ? copy.apiKeyPlaceholderKeep : copy.apiKeyPlaceholderPaste}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.responseFormatLabel}</span>
            <select
              name="responseFormat"
              defaultValue={data.config?.responseFormat ?? "auto"}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              <option value="auto">AUTO</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.pollingIntervalLabel}</span>
            <input
              name="pollIntervalSeconds"
              type="number"
              defaultValue={data.config?.pollIntervalSeconds ?? 60}
              placeholder="60"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              {copy.saveLabel}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
