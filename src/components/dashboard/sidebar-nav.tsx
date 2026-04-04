"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { getDashboardNavItems } from "@/components/dashboard/navigation";
import type { AppLanguage } from "@/lib/settings/preferences";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

type SidebarNavProps = {
  language: AppLanguage;
};

export function SidebarNav({ language }: SidebarNavProps) {
  const pathname = usePathname();
  const dashboardNavItems = getDashboardNavItems(language);

  return (
    <nav className="space-y-2">
      {dashboardNavItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group block rounded-2xl border px-4 py-4 transition-all",
              active
                ? "border-[color:var(--dashboard-nav-active-border)] bg-[color:var(--dashboard-nav-active-bg)] text-[color:var(--dashboard-heading)] shadow-[0_0_0_1px_var(--dashboard-nav-active-ring)]"
                : "border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface-subtle)] text-[color:var(--dashboard-body)] hover:border-[color:var(--dashboard-border-strong)] hover:bg-[color:var(--dashboard-surface-muted)] hover:text-[color:var(--dashboard-heading)]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm transition",
                  active
                    ? "border-[color:var(--dashboard-nav-active-border)] bg-[color:var(--dashboard-nav-active-bg)] text-[color:var(--dashboard-heading)]"
                    : "border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-[color:var(--dashboard-body)] group-hover:border-[color:var(--dashboard-border-strong)] group-hover:text-[color:var(--dashboard-heading)]",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className="block text-sm font-semibold tracking-wide">{item.label}</span>
            </div>
          </Link>
        );
      })}

      <form action="/logout" method="post" className="pt-2">
        <ConfirmSubmitButton
          title="Logout?"
          description="You will be signed out of the current workspace session."
          confirmLabel="Logout"
          className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface-subtle)] px-4 py-3 text-left text-[color:var(--dashboard-body)] transition hover:border-[color:var(--dashboard-border-strong)] hover:bg-[color:var(--dashboard-surface-muted)] hover:text-[color:var(--dashboard-heading)]"
          confirmClassName="dashboard-button-primary rounded-full px-4 py-2.5 text-sm font-medium"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface)] text-sm">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </span>
          <span className="block text-sm font-semibold tracking-wide">Logout</span>
        </ConfirmSubmitButton>
      </form>
    </nav>
  );
}
