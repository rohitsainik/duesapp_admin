"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, AppRole } from "@/lib/nav";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  Dashboard: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Admins: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <path d="M10 2l2.09 4.26 4.7.68-3.4 3.32.8 4.68L10 12.77l-4.19 2.17.8-4.68L3.21 6.94l4.7-.68z" strokeLinejoin="round" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <circle cx="8" cy="6.5" r="2.8" />
      <path d="M2 17c0-3.31 2.69-5.5 6-5.5s6 2.19 6 5.5" strokeLinecap="round" />
      <path d="M14 8c1.38 0 2.5 1.12 2.5 2.5M16.5 17c0-1.93-1.12-3.5-2.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  Loans: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <rect x="1.5" y="5" width="17" height="11" rx="2" />
      <path d="M1.5 9h17" strokeLinecap="round" />
      <circle cx="5.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 13.5h5" strokeLinecap="round" />
    </svg>
  ),
  Reports: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <path d="M6.5 7h7M6.5 10h7M6.5 13h4.5" strokeLinecap="round" />
    </svg>
  ),
  "Accounts / Reports": (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <path d="M3 14.5l3.5-4.5 3 3.5 3.5-5 3 4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="2" width="16" height="16" rx="2" />
    </svg>
  ),
  "Reports / Account": (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <path d="M3 14.5l3.5-4.5 3 3.5 3.5-5 3 4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="2" width="16" height="16" rx="2" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5V4M10 16v1.5M2.5 10H4M16 10h1.5M4.4 4.4l1.1 1.1M14.5 14.5l1.1 1.1M4.4 15.6l1.1-1.1M14.5 5.5l1.1-1.1" strokeLinecap="round" />
    </svg>
  ),
};

const ROLE_CONFIG: Record<AppRole, { label: string }> = {
  superadmin: { label: "Super Admin" },
  admin: { label: "Admin" },
  user: { label: "Member" },
};

// ── Hamburger ─────────────────────────────────────────────────────────────────
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-5 h-5">
      {open ? (
        <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
      ) : (
        <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ── Shared sidebar body ───────────────────────────────────────────────────────
function SidebarContent({
  role,
  userName,
  otherItems,
  settingsItem,
  isActive,
  onNavigate,
}: {
  role: AppRole;
  userName: string;
  otherItems: { href: string; label: string; icon: string }[];
  settingsItem: { href: string; label: string; icon: string } | undefined;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const homeHref =
    role === "superadmin" ? "/superadmin" : role === "admin" ? "/admin" : "/dashboard";
  const cfg = ROLE_CONFIG[role];
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Logo bar ── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 flex-shrink-0">
        <Link href={homeHref} onClick={onNavigate} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200/70 transition group-hover:bg-blue-700">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.9" className="w-[18px] h-[18px]">
              <rect x="2" y="5" width="16" height="11" rx="2" />
              <path d="M2 9h16" />
              <circle cx="5.5" cy="13" r="1" fill="white" stroke="none" />
              <path d="M8.5 13h5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-slate-900 tracking-tight">Duesbook</p>
            <p className="text-[10px] text-blue-500 font-semibold tracking-wide uppercase">Loan Management</p>
          </div>
        </Link>
      </div>

      {/* ── User card ── */}
      {/* <div className="mx-4 mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-4 shadow-lg shadow-blue-300/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 ring-2 ring-white/30">
            {initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-blue-100 mt-0.5">{cfg.label}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/40 flex-shrink-0" title="Online" />
        </div>
      </div> */}

      {/* ── Section label ── */}
      <div className="px-5 pt-6 pb-2 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Main Menu</p>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
        {otherItems.map((item) => {
          const active = isActive(item.href);
          const icon = ICONS[item.label];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium
                transition-all duration-150
                ${active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-300/40"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                }
              `}
            >
              {/* Icon */}
              <span className={`
                flex-shrink-0 flex h-[30px] w-[30px] items-center justify-center rounded-lg transition-all
                ${active
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                }
              `}>
                {icon}
              </span>

              <span className="truncate flex-1">{item.label}</span>

              {/* Active right chevron dot */}
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-5 mt-3 border-t border-slate-100 flex-shrink-0" />

      {/* ── Settings + Sign out ── */}
      <div className="px-3 pt-2 pb-5 space-y-1 flex-shrink-0">
        {settingsItem && (() => {
          const active = isActive(settingsItem.href);
          const icon = ICONS[settingsItem.label];
          return (
            <Link
              href={settingsItem.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150
                ${active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-300/40"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                }
              `}
            >
              <span className={`flex-shrink-0 flex h-[30px] w-[30px] items-center justify-center rounded-lg transition-all ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>
                {icon}
              </span>
              <span className="truncate flex-1">{settingsItem.label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
            </Link>
          );
        })()}

        <Link
          href="/logout"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
        >
          <span className="flex-shrink-0 flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 transition-all">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
              <path d="M13 10H3M7 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 3h5a2 2 0 012 2v10a2 2 0 01-2 2h-5" strokeLinecap="round" />
            </svg>
          </span>
          <span>Sign Out</span>
        </Link>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname() || "/";
  const [role, setRole] = useState<AppRole>("user");
  const [userName, setUserName] = useState<string>("Account");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role as AppRole);
        if (data?.name) setUserName(data.name);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    const segs = href.split("/").filter(Boolean);
    if (segs.length === 1) return pathname === `/${segs[0]}`;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const items = NAV_ITEMS[role];
  const otherItems = items.filter((i) => i.label.toLowerCase() !== "settings");
  const settingsItem = items.find((i) => i.label.toLowerCase() === "settings");
  const sharedProps = { role, userName, otherItems, settingsItem, isActive };

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-100 shadow-sm flex items-center justify-between px-4">
        <Link
          href={role === "superadmin" ? "/superadmin" : role === "admin" ? "/admin" : "/dashboard"}
          className="flex items-center gap-2"
        >
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center shadow shadow-blue-200">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" className="w-[13px] h-[13px]">
              <rect x="2" y="5" width="16" height="11" rx="2" />
              <path d="M2 9h16" />
            </svg>
          </div>
          <span className="text-[14px] font-bold text-slate-900 tracking-tight">Duesbook</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${mobileOpen ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
          aria-label="Toggle menu"
        >
          <HamburgerIcon open={mobileOpen} />
        </button>
      </header>

      {/* ── Mobile spacer ── */}
      <div className="md:hidden h-14" />

      {/* ── Backdrop ── */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile drawer ── */}
      <aside
        className={`md:hidden fixed top-14 left-0 bottom-0 z-50 w-72 shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full overflow-y-auto bg-white">
          <SidebarContent {...sharedProps} onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col w-[248px] flex-shrink-0 sticky top-0 h-[100dvh] border-r border-slate-100 shadow-[1px_0_16px_0_rgba(59,130,246,0.07)] bg-white overflow-y-auto">
        <SidebarContent {...sharedProps} />
      </aside>
    </>
  );
}