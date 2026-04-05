import { redirect } from "next/navigation";

import { signInWithPasswordAction } from "@/lib/auth/actions";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { getOptionalCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const COPY: Record<
  AppLanguage,
  {
    errors: Record<string, string>;
    eyebrow: string;
    title: string;
    description: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    resetPassword: string;
    passwordPlaceholder: string;
    trustedDevice: string;
    ssoReady: string;
    signIn: string;
    reminderTitle: string;
    reminderDescription: string;
  }
> = {
  en: {
    errors: {
      missing_credentials: "Enter both your email address and password to continue.",
      invalid_credentials: "The provided credentials could not be verified.",
      no_dashboard_access:
        "This account is signed in, but it does not have an active dashboard profile yet. Add it to the users table and assign an active company.",
    },
    eyebrow: "Secure Access",
    title: "Sign in to the control tower",
    description:
      "Use your Supabase-backed admin account to manage stores, notification routing, Redash connectivity, and alert thresholds.",
    emailLabel: "Work email",
    emailPlaceholder: "ops@company.com",
    passwordLabel: "Password",
    resetPassword: "Reset password",
    passwordPlaceholder: "Enter your password",
    trustedDevice: "Keep this device trusted for 7 days",
    ssoReady: "SSO ready",
    signIn: "Sign in",
    reminderTitle: "Operational reminder",
    reminderDescription:
      "Admin sessions should be limited to authorized users because this console controls Telegram delivery routing and tenant-level API credentials.",
  },
  fr: {
    errors: {
      missing_credentials: "Renseignez l'email et le mot de passe pour continuer.",
      invalid_credentials: "Les identifiants fournis n'ont pas pu etre verifies.",
      no_dashboard_access:
        "Ce compte est connecte, mais il n'a pas encore de profil dashboard actif. Ajoutez-le dans la table users et assignez-lui une societe active.",
    },
    eyebrow: "Acces securise",
    title: "Se connecter a la control tower",
    description:
      "Utilisez votre compte admin lie a Supabase pour gerer les magasins, le routage des notifications, la connectivite Redash et les seuils d'alerte.",
    emailLabel: "Email professionnel",
    emailPlaceholder: "ops@company.com",
    passwordLabel: "Mot de passe",
    resetPassword: "Reinitialiser",
    passwordPlaceholder: "Entrez votre mot de passe",
    trustedDevice: "Garder cet appareil approuve pendant 7 jours",
    ssoReady: "SSO pret",
    signIn: "Se connecter",
    reminderTitle: "Rappel operationnel",
    reminderDescription:
      "Les sessions admin doivent rester limitees aux utilisateurs autorises car cette console controle le routage Telegram et les identifiants API.",
  },
  ar: {
    errors: {
      missing_credentials: "أدخل البريد الإلكتروني وكلمة المرور للمتابعة.",
      invalid_credentials: "تعذر التحقق من بيانات الدخول المقدمة.",
    },
    eyebrow: "وصول آمن",
    title: "تسجيل الدخول إلى برج التحكم",
    description:
      "استخدم حساب الإدارة المرتبط بـ Supabase لإدارة المتاجر وتوجيه الإشعارات وربط Redash وحدود التنبيه.",
    emailLabel: "بريد العمل",
    emailPlaceholder: "ops@company.com",
    passwordLabel: "كلمة المرور",
    resetPassword: "إعادة التعيين",
    passwordPlaceholder: "أدخل كلمة المرور",
    trustedDevice: "الاحتفاظ بهذا الجهاز موثوقاً لمدة 7 أيام",
    ssoReady: "جاهز لـ SSO",
    signIn: "تسجيل الدخول",
    reminderTitle: "تذكير تشغيلي",
    reminderDescription:
      "يجب أن تقتصر جلسات الإدارة على المستخدمين المصرح لهم لأن هذه المنصة تتحكم في توجيه تيليغرام وبيانات API.",
  },
  pt: {
    errors: {
      missing_credentials: "Informe o email e a senha para continuar.",
      invalid_credentials: "As credenciais fornecidas nao puderam ser validadas.",
      no_dashboard_access:
        "Esta conta entrou com sucesso, mas ainda nao possui um perfil ativo no dashboard. Adicione-a na tabela users e vincule-a a uma empresa ativa.",
    },
    eyebrow: "Acesso seguro",
    title: "Entrar na control tower",
    description:
      "Use sua conta administrativa com Supabase para gerir lojas, roteamento de notificacoes, conectividade Redash e limites de alerta.",
    emailLabel: "Email de trabalho",
    emailPlaceholder: "ops@company.com",
    passwordLabel: "Senha",
    resetPassword: "Redefinir senha",
    passwordPlaceholder: "Digite sua senha",
    trustedDevice: "Manter este dispositivo confiavel por 7 dias",
    ssoReady: "SSO pronto",
    signIn: "Entrar",
    reminderTitle: "Lembrete operacional",
    reminderDescription:
      "As sessoes administrativas devem ficar restritas a usuarios autorizados porque este console controla o roteamento do Telegram e as credenciais da API.",
  },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getOptionalCompanyContext();
  if (context) {
    redirect("/dashboard");
  }

  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const params = await searchParams;
  const errorMessage = params.error
    ? copy.errors[params.error] ?? COPY.en.errors[params.error] ?? null
    : null;

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur xl:p-10">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{copy.title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{copy.description}</p>
      </div>

      <form action={signInWithPasswordAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            {copy.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={copy.emailPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              {copy.passwordLabel}
            </label>
            <button
              type="button"
              className="text-sm font-medium text-cyan-700 transition hover:text-cyan-900"
            >
              {copy.resetPassword}
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={copy.passwordPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            {copy.trustedDevice}
          </label>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {copy.ssoReady}
          </span>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {copy.signIn}
        </button>
      </form>

      {errorMessage ? (
        <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">{copy.reminderTitle}</p>
        <p className="mt-2 leading-6 text-amber-800">{copy.reminderDescription}</p>
      </div>
    </div>
  );
}
