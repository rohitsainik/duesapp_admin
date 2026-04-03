"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NAV_ITEMS, AppRole } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();
  const role = (session?.user?.role || "user") as AppRole;

  // segment-aware active check
  const isActive = (href: string) => {
    // exact for homepage
    if (href === "/") return pathname === "/";

    // exact for section roots like /admin or /superadmin
    const segs = href.split("/").filter(Boolean); // e.g. ["admin"], ["admin","users"]
    const isSectionRoot = segs.length === 1; // /admin or /superadmin

    if (isSectionRoot) {
      return pathname === `/${segs[0]}`;
    }

    // for deeper links: exact or child path (href + "/")
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="w-64 bg-white border-r hidden md:flex md:flex-col md:sticky md:top-0 md:h-[100dvh] md:overflow-y-auto">
      {/* App logo section */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Link
          href={
            role === "superadmin"
              ? "/superadmin"
              : role === "admin"
              ? "/admin"
              : "/dashboard"
          }
          className="group inline-flex items-center gap-2"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-semibold shadow-sm group-hover:scale-[1.03] transition">
            D
          </span>
          <span className="text-base font-semibold tracking-wide text-gray-900">
            Duesbook
          </span>
        </Link>
      </div>
      {/* Top spacer replaced with logo */}

      <div className="flex-1 p-3">
        <nav className="space-y-1">
          {(() => {
            const items = NAV_ITEMS[role];
            const otherItems = items.filter(
              (i) => i.label.toLowerCase() !== "settings"
            );

            return (
              <>
                {otherItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                        active
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                          active
                            ? "bg-white shadow-sm"
                            : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                      </span>
                      <span className="font-medium">{item.label}</span>
                      {active && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-indigo-500" />
                      )}
                    </Link>
                  );
                })}
              </>
            );
          })()}
        </nav>
      </div>

      {(() => {
        const items = NAV_ITEMS[(session?.user?.role || "user") as AppRole];
        const settingsItem = items.find(
          (i) => i.label.toLowerCase() === "settings"
        );
        if (!settingsItem) return null;
        const active = isActive(settingsItem.href);
        return (
          <div className="p-3 border-t bg-gray-100">
            <Link
              key={settingsItem.href}
              href={settingsItem.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                  active
                    ? "bg-white shadow-sm"
                    : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                }`}
              >
                <span className="text-base">{settingsItem.icon}</span>
              </span>
              <span className="font-medium">{settingsItem.label}</span>
              {active && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-indigo-500" />
              )}
            </Link>
          </div>
        );
      })()}
    </aside>
  );
}
