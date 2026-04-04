"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { getDashboardNavItems } from "@/components/dashboard/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();
  const dashboardNavItems = getDashboardNavItems();

  return (
    <nav className="space-y-2">
      {dashboardNavItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group block rounded-2xl border px-4 py-3 transition-all",
              active
                ? "border-cyan-400/60 bg-cyan-500/12 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/8 hover:text-white",
            ].join(" ")}
          >
            <div className="text-sm font-semibold tracking-wide">{item.label}</div>
            <div
              className={[
                "mt-1 text-xs",
                active ? "text-cyan-100/80" : "text-slate-400 group-hover:text-slate-300",
              ].join(" ")}
            >
              {item.description}
            </div>
          </Link>
        );
      })}

      <form action="/logout" method="post" className="pt-2">
        <ConfirmSubmitButton
          title="Logout?"
          description="You will be signed out of the current workspace session."
          confirmLabel="Logout"
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          confirmClassName="rounded-full border border-cyan-300/25 bg-cyan-400/18 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/24"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </span>
          <span className="block">
            <span className="block text-sm font-semibold tracking-wide">Logout</span>
            <span className="mt-1 block text-xs text-slate-400">End the current session</span>
          </span>
        </ConfirmSubmitButton>
      </form>
    </nav>
  );
}
