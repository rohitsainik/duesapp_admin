"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

interface UserInfo {
  name: string;
  role: "user" | "admin" | "superadmin";
}

const ROLE_CONFIG: Record<
  UserInfo["role"],
  { label: string; pill: string; dot: string; home: string }
> = {
  superadmin: {
    label: "Super Admin",
    pill: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
    dot: "bg-amber-400",
    home: "/superadmin",
  },
  admin: {
    label: "Admin",
    pill: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
    dot: "bg-blue-500",
    home: "/admin",
  },
  user: {
    label: "Member",
    pill: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
    dot: "bg-emerald-400",
    home: "/dashboard",
  },
};

// Bell icon
function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-[18px] h-[18px]">
      <path d="M10 2a6 6 0 00-6 6v2.5l-1.5 2.5h15L16 10.5V8a6 6 0 00-6-6z" strokeLinejoin="round" />
      <path d="M8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" />
    </svg>
  );
}

// Chevron icon
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Key icon
function KeyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
      <circle cx="8" cy="9" r="4" />
      <path d="M11.5 9h5M14.5 7v4" strokeLinecap="round" />
    </svg>
  );
}

// Logout icon
function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
      <path d="M13 10H3M7 6l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3h5a2 2 0 012 2v10a2 2 0 01-2 2h-5" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch on mount — keeps role accurate after refresh
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser({ name: data.name || "User", role: data.role || "user" });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const name = user?.name || "User";
  const role = user?.role || "user";
  const initials = useMemo(() => initialsOf(name), [name]);
  const cfg = ROLE_CONFIG[role];

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth/login");
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-100 shadow-[0_1px_8px_0_rgba(59,130,246,0.07)]">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* ── Left: breadcrumb / page title area ── */}
        <div className="flex items-center gap-2 min-w-0">
          {/* On mobile this space is already occupied by the sidebar hamburger in layout.
              On desktop we can show a subtle welcome or keep it empty. */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-6 w-[3px] rounded-full bg-blue-600" />
            <p className="text-[13px] font-semibold text-slate-700 truncate">
              {loading ? (
                <span className="inline-block h-4 w-28 rounded bg-slate-100 animate-pulse" />
              ) : (
                <>Welcome back, <span className="text-blue-600">{name.split(" ")[0]}</span> 👋</>
              )}
            </p>
          </div>
        </div>

        {/* ── Right: actions + avatar ── */}
        <div className="flex items-center gap-2">

          {/* Role pill — hidden on very small screens */}
          {!loading && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          )}

          {/* Notification bell */}
          <button className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
            <BellIcon />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white" />
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-150
                ${open
                  ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 shadow-sm"
                }
              `}
            >
              {/* Avatar circle */}
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-blue-200 flex-shrink-0">
                {loading ? "…" : initials || "U"}
              </div>

              {/* Name — hidden on mobile */}
              <span className="hidden sm:block text-[13px] font-medium text-slate-700 max-w-[120px] truncate">
                {loading ? (
                  <span className="inline-block h-3.5 w-20 rounded bg-slate-100 animate-pulse" />
                ) : name}
              </span>

              <ChevronIcon open={open} />
            </button>

            {/* ── Dropdown ── */}
            {open && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">

                {/* User info card */}
                <div className="px-4 py-3.5 bg-gradient-to-br from-blue-600 to-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-[13px] ring-2 ring-white/30 flex-shrink-0">
                      {initials || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{name}</p>
                      <p className="text-[11px] text-blue-100 mt-0.5">{cfg.label}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    href="/auth/change-password"
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors flex-shrink-0">
                      <KeyIcon />
                    </span>
                    Change Password
                  </Link>

                  <div className="h-px bg-slate-100 mx-1" />

                  <button
                    onClick={handleLogout}
                    className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors flex-shrink-0">
                      <LogoutIcon />
                    </span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}