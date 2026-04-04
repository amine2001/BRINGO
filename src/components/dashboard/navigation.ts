export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
};

export function getDashboardNavItems(): DashboardNavItem[] {
  return [
    {
      href: "/dashboard",
      label: "Overview",
      description: "Operations command center",
    },
    {
      href: "/dashboard/stores",
      label: "Stores",
      description: "Store routing and delivery types",
    },
    {
      href: "/dashboard/telegram-groups",
      label: "Telegram Groups",
      description: "Chat targets and mappings",
    },
    {
      href: "/dashboard/notification-settings",
      label: "Notification Settings",
      description: "Repeat cadence and stop rules",
    },
    {
      href: "/dashboard/delay-settings",
      label: "Delay Settings",
      description: "Admin alert thresholds",
    },
    {
      href: "/dashboard/api-config",
      label: "API Config",
      description: "Redash connection settings",
    },
    {
      href: "/dashboard/access",
      label: "Access",
      description: "Manage users and permissions",
    },
  ];
}
