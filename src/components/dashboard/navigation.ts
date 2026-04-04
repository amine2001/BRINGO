import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faClock,
  faComments,
  faDiagramProject,
  faGear,
  faHouse,
  faPlug,
  faStore,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";

import type { AppLanguage } from "@/lib/settings/preferences";

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconDefinition;
};

const NAV_LABELS: Record<
  AppLanguage,
  Array<Pick<DashboardNavItem, "label" | "description">>
> = {
  en: [
    { label: "Overview", description: "Operations command center" },
    { label: "Stores", description: "Store routing and delivery types" },
    { label: "Telegram Groups", description: "Chat targets and mappings" },
    { label: "Workflow", description: "Stages, timings, and reminder rules" },
    { label: "Delay Settings", description: "Admin alert thresholds" },
    { label: "API Config", description: "Redash connection settings" },
    { label: "Access", description: "Manage users and permissions" },
    { label: "Settings", description: "Language and theme preferences" },
  ],
  fr: [
    { label: "Vue d'ensemble", description: "Centre de pilotage des operations" },
    { label: "Magasins", description: "Routage magasin et types de livraison" },
    { label: "Groupes Telegram", description: "Destinations chat et mappings" },
    { label: "Workflow", description: "Etapes, timings et rappels" },
    { label: "Retards", description: "Seuils d'alerte admin" },
    { label: "API", description: "Configuration Redash" },
    { label: "Acces", description: "Utilisateurs et permissions" },
    { label: "Parametres", description: "Langue et theme" },
  ],
  ar: [
    { label: "Overview", description: "Operations command center" },
    { label: "Stores", description: "Store routing and delivery types" },
    { label: "Telegram", description: "Chat targets and mappings" },
    { label: "Workflow", description: "Stages, timings, and reminder rules" },
    { label: "Delays", description: "Admin alert thresholds" },
    { label: "API", description: "Redash connection settings" },
    { label: "Access", description: "Manage users and permissions" },
    { label: "Settings", description: "Language and theme preferences" },
  ],
  pt: [
    { label: "Visao Geral", description: "Centro operacional" },
    { label: "Lojas", description: "Rotas das lojas e tipos de entrega" },
    { label: "Grupos Telegram", description: "Destinos do chat e mapeamentos" },
    { label: "Workflow", description: "Etapas, tempos e regras de alerta" },
    { label: "Atrasos", description: "Limites de alerta do admin" },
    { label: "API", description: "Configuracao do Redash" },
    { label: "Acesso", description: "Usuarios e permissoes" },
    { label: "Configuracoes", description: "Idioma e tema" },
  ],
};

export function getDashboardNavItems(language: AppLanguage = "en"): DashboardNavItem[] {
  const labels = NAV_LABELS[language];

  return [
    {
      href: "/dashboard",
      label: labels[0].label,
      description: labels[0].description,
      icon: faHouse,
    },
    {
      href: "/dashboard/stores",
      label: labels[1].label,
      description: labels[1].description,
      icon: faStore,
    },
    {
      href: "/dashboard/telegram-groups",
      label: labels[2].label,
      description: labels[2].description,
      icon: faComments,
    },
    {
      href: "/dashboard/workflow",
      label: labels[3].label,
      description: labels[3].description,
      icon: faDiagramProject,
    },
    {
      href: "/dashboard/delay-settings",
      label: labels[4].label,
      description: labels[4].description,
      icon: faClock,
    },
    {
      href: "/dashboard/api-config",
      label: labels[5].label,
      description: labels[5].description,
      icon: faPlug,
    },
    {
      href: "/dashboard/access",
      label: labels[6].label,
      description: labels[6].description,
      icon: faUsersGear,
    },
    {
      href: "/dashboard/settings",
      label: labels[7].label,
      description: labels[7].description,
      icon: faGear,
    },
  ];
}
