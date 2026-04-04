"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/components/dashboard/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();

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
    </nav>
  );
}
