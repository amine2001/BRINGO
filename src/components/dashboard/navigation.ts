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

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconDefinition;
};

export function getDashboardNavItems(): DashboardNavItem[] {
  return [
    {
      href: "/dashboard",
      label: "Overview",
      description: "Operations command center",
      icon: faHouse,
    },
    {
      href: "/dashboard/stores",
      label: "Stores",
      description: "Store routing and delivery types",
      icon: faStore,
    },
    {
      href: "/dashboard/telegram-groups",
      label: "Telegram Groups",
      description: "Chat targets and mappings",
      icon: faComments,
    },
    {
      href: "/dashboard/workflow",
      label: "Workflow",
      description: "Stages, timings, and reminder rules",
      icon: faDiagramProject,
    },
    {
      href: "/dashboard/delay-settings",
      label: "Delay Settings",
      description: "Admin alert thresholds",
      icon: faClock,
    },
    {
      href: "/dashboard/api-config",
      label: "API Config",
      description: "Redash connection settings",
      icon: faPlug,
    },
    {
      href: "/dashboard/access",
      label: "Access",
      description: "Manage users and permissions",
      icon: faUsersGear,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      description: "Language and theme preferences",
      icon: faGear,
    },
  ];
}
