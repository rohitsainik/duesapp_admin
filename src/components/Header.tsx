"use client";

import React, { useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

export function Header() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const name = session?.user?.name || "User";
  const role = (session?.user?.role || "user") as
    | "user"
    | "admin"
    | "superadmin";
  const initials = useMemo(() => initialsOf(name), [name]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand - keep here only */}
        <Link
          href={
            role === "superadmin"
              ? "/superadmin"
              : role === "admin"
              ? "/admin"
              : "/dashboard"
          }
          className="group inline-flex items-center gap-2"
        ></Link>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium capitalize">
            {role}
          </span>

          {/* Profile button */}
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-3 rounded-xl border bg-white px-3 py-1.5 shadow-sm hover:shadow transition"
            >
              <span className="text-sm font-medium text-gray-700 max-sm:hidden">
                {name}
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold">
                {initials || "U"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
                onMouseLeave={() => setOpen(false)}
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
                <div className="h-px bg-gray-100" />
                <Link
                  href="/auth/change-password"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  🔑 Change Password
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
