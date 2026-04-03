"use client";

import React, { useMemo, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoleHome } from "@/lib/nav";

export function LoginForm() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || undefined;

  const valid = useMemo(
    () => userId.trim().length > 0 && password.length >= 4,
    [userId, password]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Please enter a valid User ID and a password (min 4 chars)");
      return;
    }
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      userId, // matches your Credentials provider field
      password,
      redirect: false, // we will redirect after reading the role
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role as
      | "admin"
      | "superadmin"
      | "user"
      | undefined;

    const target = callbackUrl || getRoleHome(role);
    router.replace(target);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-md rounded-2xl border bg-white/90 p-7 shadow-xl ring-1 ring-gray-200 backdrop-blur transition-all"
    >
      {/* Accent bar */}
      <span className="absolute -top-0.5 left-6 h-1.5 w-28 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400" />

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <span>🔐</span>
          <span>DuesLoan Portal</span>
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">Sign in to continue</p>
      </div>

      {/* User ID */}
      <div className="mb-4">
        <label
          className="mb-1 block text-sm font-medium text-gray-700"
          htmlFor="userId"
        >
          User ID
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-gray-400">
            👤
          </span>
          <input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. ADM001"
            className="w-full rounded-lg border bg-white px-3 py-2 pl-9 text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            autoComplete="username"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-1">
        <label
          className="mb-1 block text-sm font-medium text-gray-700"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-gray-400">
            🔒
          </span>
          <input
            id="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border bg-white px-3 py-2 pl-9 pr-11 text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Remember me
          </label>
          <a href="#" className="text-indigo-600 hover:underline">
            Forgot password?
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      {/* Action */}
      <div className="mt-6">
        <button
          disabled={!valid || loading}
          className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div className="mt-3 text-center text-xs text-gray-500">
          By signing in you agree to our{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </form>
  );
}
