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
  icon: IconDefinition;
};

const NAV_LABELS: Record<AppLanguage, string[]> = {
  en: ["Overview", "Stores", "Telegram Groups", "Workflow", "Delay Settings", "API Config", "Access", "Settings"],
  fr: ["Vue d'ensemble", "Magasins", "Groupes Telegram", "Workflow", "Retards", "API", "Acces", "Parametres"],
  ar: ["Overview", "Stores", "Telegram", "Workflow", "Delays", "API", "Access", "Settings"],
  pt: ["Visao Geral", "Lojas", "Grupos Telegram", "Workflow", "Atrasos", "API", "Acesso", "Configuracoes"],
};

export function getDashboardNavItems(language: AppLanguage = "en"): DashboardNavItem[] {
  const labels = NAV_LABELS[language];

  return [
    {
      href: "/dashboard",
      label: labels[0],
      icon: faHouse,
    },
    {
      href: "/dashboard/stores",
      label: labels[1],
      icon: faStore,
    },
    {
      href: "/dashboard/telegram-groups",
      label: labels[2],
      icon: faComments,
    },
    {
      href: "/dashboard/workflow",
      label: labels[3],
      icon: faDiagramProject,
    },
    {
      href: "/dashboard/delay-settings",
      label: labels[4],
      icon: faClock,
    },
    {
      href: "/dashboard/api-config",
      label: labels[5],
      icon: faPlug,
    },
    {
      href: "/dashboard/access",
      label: labels[6],
      icon: faUsersGear,
    },
    {
      href: "/dashboard/settings",
      label: labels[7],
      icon: faGear,
    },
  ];
}
