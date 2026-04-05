import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/data-table";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveUserAction, toggleUserActiveAction } from "@/lib/dashboard/actions";
import { getUsersPageData } from "@/lib/dashboard/queries";
import {
  USER_ROLES,
  canAccessUserManagement,
  isSuperUserRole,
} from "@/lib/auth/roles";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    columns: [string, string, string, string];
    unassignedName: string;
    active: string;
    disabled: string;
    saveAccess: string;
    disableTitle: string;
    disableDescription: string;
    disableConfirm: string;
    disableCancel: string;
    disableAction: string;
    enableAction: string;
    headerEyebrow: string;
    headerTitle: string;
    headerDescription: string;
    directoryTitle: string;
    directoryDescription: string;
    createTitle: string;
    createDescription: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    role: string;
    createUser: string;
    roles: Record<string, string>;
  }
> = {
  en: {
    columns: ["User", "Role", "Status", "Actions"],
    unassignedName: "Unassigned name",
    active: "Active",
    disabled: "Disabled",
    saveAccess: "Save access",
    disableTitle: "Disable this user?",
    disableDescription:
      "The user will immediately lose access to the dashboard until you enable the account again.",
    disableConfirm: "Disable user",
    disableCancel: "Cancel",
    disableAction: "Disable user",
    enableAction: "Enable user",
    headerEyebrow: "Access",
    headerTitle: "Manage users and permissions",
    headerDescription: "Manage Bringo user roles, access status, and sign-in readiness from one place.",
    directoryTitle: "Access directory",
    directoryDescription: "Review each user's role and account status from one screen.",
    createTitle: "Create access",
    createDescription: "Add a new user and choose the right role for the Bringo operations team.",
    fullName: "Full name",
    fullNamePlaceholder: "Sara El Idrissi",
    email: "Email address",
    emailPlaceholder: "admin@bringo.ma",
    password: "Temporary password",
    passwordPlaceholder: "Set an initial password",
    role: "Role",
    createUser: "Create user",
    roles: {
      super_user: "super user",
      admin: "admin",
      operator: "operator",
      viewer: "viewer",
    },
  },
  fr: {
    columns: ["Utilisateur", "Role", "Statut", "Actions"],
    unassignedName: "Nom non renseigne",
    active: "Actif",
    disabled: "Desactive",
    saveAccess: "Enregistrer l'acces",
    disableTitle: "Desactiver cet utilisateur ?",
    disableDescription:
      "L'utilisateur perdra immediatement l'acces au dashboard jusqu'a sa reactivation.",
    disableConfirm: "Desactiver l'utilisateur",
    disableCancel: "Annuler",
    disableAction: "Desactiver",
    enableAction: "Activer",
    headerEyebrow: "Acces",
    headerTitle: "Gerer les utilisateurs et les permissions",
    headerDescription:
      "Gerez les roles Bringo, le statut d'acces et l'etat de connexion depuis un seul endroit.",
    directoryTitle: "Annuaire des acces",
    directoryDescription: "Consultez le role et le statut de chaque utilisateur sur un seul ecran.",
    createTitle: "Creer un acces",
    createDescription: "Ajoutez un utilisateur et choisissez le bon role pour l'equipe Bringo.",
    fullName: "Nom complet",
    fullNamePlaceholder: "Sara El Idrissi",
    email: "Adresse email",
    emailPlaceholder: "admin@bringo.ma",
    password: "Mot de passe temporaire",
    passwordPlaceholder: "Definir un mot de passe initial",
    role: "Role",
    createUser: "Creer l'utilisateur",
    roles: {
      super_user: "super utilisateur",
      admin: "admin",
      operator: "operateur",
      viewer: "lecteur",
    },
  },
  ar: {
    columns: ["المستخدم", "الدور", "الحالة", "الإجراءات"],
    unassignedName: "بدون اسم",
    active: "نشط",
    disabled: "معطل",
    saveAccess: "حفظ الصلاحية",
    disableTitle: "تعطيل هذا المستخدم؟",
    disableDescription:
      "سيفقد المستخدم الوصول إلى لوحة التحكم مباشرة حتى يتم تفعيل الحساب مرة أخرى.",
    disableConfirm: "تعطيل المستخدم",
    disableCancel: "إلغاء",
    disableAction: "تعطيل المستخدم",
    enableAction: "تفعيل المستخدم",
    headerEyebrow: "الوصول",
    headerTitle: "إدارة المستخدمين والصلاحيات",
    headerDescription: "أدر أدوار مستخدمي Bringo وحالة الوصول والاستعداد لتسجيل الدخول من مكان واحد.",
    directoryTitle: "دليل الوصول",
    directoryDescription: "راجع دور كل مستخدم وحالة حسابه من شاشة واحدة.",
    createTitle: "إنشاء وصول جديد",
    createDescription: "أضف مستخدماً جديداً واختر الدور المناسب لفريق عمليات Bringo.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "Sara El Idrissi",
    email: "البريد الإلكتروني",
    emailPlaceholder: "admin@bringo.ma",
    password: "كلمة مرور مؤقتة",
    passwordPlaceholder: "حدد كلمة مرور أولية",
    role: "الدور",
    createUser: "إنشاء المستخدم",
    roles: {
      super_user: "مستخدم خارق",
      admin: "مدير",
      operator: "مشغل",
      viewer: "مشاهد",
    },
  },
  pt: {
    columns: ["Usuario", "Papel", "Status", "Acoes"],
    unassignedName: "Nome nao definido",
    active: "Ativo",
    disabled: "Desativado",
    saveAccess: "Salvar acesso",
    disableTitle: "Desativar este usuario?",
    disableDescription:
      "O usuario perdera imediatamente o acesso ao dashboard ate que a conta seja reativada.",
    disableConfirm: "Desativar usuario",
    disableCancel: "Cancelar",
    disableAction: "Desativar usuario",
    enableAction: "Ativar usuario",
    headerEyebrow: "Acesso",
    headerTitle: "Gerir usuarios e permissoes",
    headerDescription:
      "Gira papeis da Bringo, status de acesso e prontidao de login a partir de um unico lugar.",
    directoryTitle: "Diretorio de acesso",
    directoryDescription: "Revise o papel e o status de cada usuario em uma unica tela.",
    createTitle: "Criar acesso",
    createDescription: "Adicione um novo usuario e escolha o papel certo para a equipe Bringo.",
    fullName: "Nome completo",
    fullNamePlaceholder: "Sara El Idrissi",
    email: "Endereco de email",
    emailPlaceholder: "admin@bringo.ma",
    password: "Senha temporaria",
    passwordPlaceholder: "Defina uma senha inicial",
    role: "Papel",
    createUser: "Criar usuario",
    roles: {
      super_user: "super usuario",
      admin: "admin",
      operator: "operador",
      viewer: "visualizador",
    },
  },
};

export default async function AccessPage() {
  const context = await requireCompanyContext();
  if (!canAccessUserManagement(context.profile?.role)) {
    redirect("/dashboard");
  }

  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const data = await getUsersPageData(context.company.id);
  const roleOptions = USER_ROLES;

  const accessColumns = [
    { key: "user", label: copy.columns[0] },
    { key: "role", label: copy.columns[1] },
    { key: "status", label: copy.columns[2] },
    { key: "actions", label: copy.columns[3] },
  ];

  const accessRows = data.users.map((user) => ({
    user: (
      <div>
        <p className="font-medium text-white">{user.fullName ?? copy.unassignedName}</p>
        <p className="mt-1 text-xs text-slate-400">{user.email}</p>
      </div>
    ),
    role: (
      <StatusPill tone={isSuperUserRole(user.role) ? "info" : "neutral"}>
        {copy.roles[user.role] ?? user.role.replace("_", " ")}
      </StatusPill>
    ),
    status: (
      <StatusPill tone={user.isActive ? "good" : "warn"}>
        {user.isActive ? copy.active : copy.disabled}
      </StatusPill>
    ),
    actions: (
      <div className="space-y-3">
        <form action={saveUserAction} className="flex flex-col gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="fullName" value={user.fullName ?? ""} />
          <input type="hidden" name="email" value={user.email ?? ""} />
          <div className="flex flex-col gap-2 xl:flex-row">
            <select
              name="role"
              defaultValue={user.role}
              className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {copy.roles[role] ?? role.replace("_", " ")}
                </option>
              ))}
            </select>
            <button className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/15">
              {copy.saveAccess}
            </button>
          </div>
        </form>

        <form action={toggleUserActiveAction}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="nextValue" value={user.isActive ? "false" : "true"} />
          {user.isActive ? (
            <ConfirmSubmitButton
              title={copy.disableTitle}
              description={copy.disableDescription}
              confirmLabel={copy.disableConfirm}
              cancelLabel={copy.disableCancel}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              confirmClassName="rounded-full border border-amber-300/25 bg-amber-400/18 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/24"
            >
              {copy.disableAction}
            </ConfirmSubmitButton>
          ) : (
            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
              {copy.enableAction}
            </button>
          )}
        </form>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.headerEyebrow}
        title={copy.headerTitle}
        description={copy.headerDescription}
      />

      <SectionCard title={copy.directoryTitle} description={copy.directoryDescription}>
        <DataTable columns={accessColumns} rows={accessRows} />
      </SectionCard>

      <SectionCard title={copy.createTitle} description={copy.createDescription}>
        <form action={saveUserAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.fullName}</span>
            <input
              name="fullName"
              type="text"
              placeholder={copy.fullNamePlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.email}</span>
            <input
              name="email"
              type="email"
              placeholder={copy.emailPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.password}</span>
            <input
              name="password"
              type="password"
              placeholder={copy.passwordPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.role}</span>
            <select
              name="role"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {copy.roles[role] ?? role.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              {copy.createUser}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
