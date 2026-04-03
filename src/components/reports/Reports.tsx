"use client";

import React, { useMemo, useState } from "react";

// -----------------------------
// Types
// -----------------------------
type LoanStatus = "active" | "closed" | "overdue";
type LoanType = "personal" | "business" | "education" | "home";

interface Loan {
  id: string;
  type: LoanType;
  status: LoanStatus;
  amount: number; // disbursed amount
  disbursedOn: string; // ISO date
  outstanding: number; // remaining amount
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loans: Loan[];
}

// -----------------------------
// Demo data
// -----------------------------
const SAMPLE_USERS: User[] = [
  {
    id: "U001",
    name: "Aditi Sharma",
    email: "aditi@example.com",
    phone: "+91-98765-00001",
    loans: [
      {
        id: "L-1001",
        type: "personal",
        status: "active",
        amount: 150000,
        disbursedOn: "2025-06-15",
        outstanding: 82000,
      },
      {
        id: "L-1002",
        type: "education",
        status: "closed",
        amount: 200000,
        disbursedOn: "2023-08-10",
        outstanding: 0,
      },
    ],
  },
  {
    id: "U002",
    name: "Rahul Verma",
    email: "rahul@example.com",
    phone: "+91-98765-00002",
    loans: [
      {
        id: "L-1003",
        type: "business",
        status: "overdue",
        amount: 500000,
        disbursedOn: "2024-02-01",
        outstanding: 360000,
      },
    ],
  },
  {
    id: "U003",
    name: "Neha Gupta",
    email: "neha@example.com",
    phone: "+91-98765-00003",
    loans: [
      {
        id: "L-1004",
        type: "home",
        status: "active",
        amount: 1200000,
        disbursedOn: "2025-04-20",
        outstanding: 1150000,
      },
    ],
  },
  {
    id: "U004",
    name: "Vikram Singh",
    email: "vikram@example.com",
    phone: "+91-98765-00004",
    loans: [
      {
        id: "L-1005",
        type: "personal",
        status: "active",
        amount: 75000,
        disbursedOn: "2025-08-01",
        outstanding: 65000,
      },
      {
        id: "L-1006",
        type: "business",
        status: "active",
        amount: 300000,
        disbursedOn: "2025-07-15",
        outstanding: 285000,
      },
    ],
  },
];

// -----------------------------
// Utils
// -----------------------------
function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// -----------------------------
// Derived shapes
// -----------------------------
interface UserReportRow {
  userId: string;
  name: string;
  email: string;
  phone: string;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  closedLoans: number;
  totalOutstanding: number;
  totalDisbursed: number;
  lastDisbursedOn?: string;
}

function buildRows(users: User[]): UserReportRow[] {
  return users.map((u) => {
    const totalLoans = u.loans.length;
    const activeLoans = u.loans.filter((l) => l.status === "active").length;
    const overdueLoans = u.loans.filter((l) => l.status === "overdue").length;
    const closedLoans = u.loans.filter((l) => l.status === "closed").length;
    const totalOutstanding = u.loans.reduce(
      (s, l) => s + (l.outstanding || 0),
      0
    );
    const totalDisbursed = u.loans.reduce((s, l) => s + l.amount, 0);
    const lastDisbursedOn = u.loans
      .map((l) => l.disbursedOn)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      userId: u.id,
      name: u.name,
      email: u.email || "—",
      phone: u.phone || "—",
      totalLoans,
      activeLoans,
      overdueLoans,
      closedLoans,
      totalOutstanding,
      totalDisbursed,
      lastDisbursedOn,
    };
  });
}

// -----------------------------
// Component
// -----------------------------
export default function Reports() {
  const [mode, setMode] = useState<"all" | "filter">("all");
  const [users] = useState<User[]>(SAMPLE_USERS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | LoanStatus>("all");
  const [type, setType] = useState<"all" | LoanType>("all");
  const [minOutstanding, setMinOutstanding] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filteredUsers = useMemo(() => {
    if (mode === "all" && !showFilters) return users;

    return users.filter((u) => {
      const matchesQuery = q
        ? [u.name, u.email, u.phone]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q.toLowerCase()))
        : true;
      const matchesStatus =
        status === "all" ? true : u.loans.some((l) => l.status === status);
      const matchesType =
        type === "all" ? true : u.loans.some((l) => l.type === type);
      const min = Number(minOutstanding);
      const matchesOutstanding =
        isNaN(min) || min <= 0
          ? true
          : u.loans.reduce((s, l) => s + (l.outstanding || 0), 0) >= min;
      return matchesQuery && matchesStatus && matchesType && matchesOutstanding;
    });
  }, [mode, users, q, status, type, minOutstanding, showFilters]);

  const rows = useMemo(() => buildRows(filteredUsers), [filteredUsers]);

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setType("all");
    setMinOutstanding("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border shadow-md bg-white overflow-hidden">
          <div className="bg-indigo-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shadow">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Reports
              </h2>
            </div>
          </div>
          <div className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                User Loan Reports
              </h1>
              <p className="text-sm text-gray-700">
                See all users with loans or narrow down with filters.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-sm">
                Total: {rows.length}
              </span>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  className={classNames(
                    "px-3 py-1.5 text-sm border-r border-gray-300",
                    mode === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-50"
                  )}
                  aria-pressed={mode === "all"}
                  onClick={() => {
                    setMode("all");
                    setShowFilters(false);
                    resetFilters();
                  }}
                >
                  All users
                </button>
                <button
                  className={classNames(
                    "px-3 py-1.5 text-sm",
                    mode === "filter"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-50"
                  )}
                  aria-pressed={mode === "filter"}
                  onClick={() => {
                    setMode("filter");
                    setShowFilters(true);
                  }}
                >
                  Filtered
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        {(mode === "filter" || showFilters) && (
          <div className="rounded-xl border shadow-md bg-white p-4 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Filter Options
                  </h3>
                  <p className="text-sm text-slate-500">
                    Refine your report data
                  </p>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Name, email, or phone..."
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Loan Status
                </label>
                <select
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(e.target.value as "all" | LoanStatus)
                  }
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="closed">Closed Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Loan Type
                </label>
                <select
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setType(e.target.value as "all" | LoanType)
                  }
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="home">Home</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Min Outstanding (₹)
                </label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={minOutstanding}
                  onChange={(e) =>
                    setMinOutstanding(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="e.g., 100000"
                  className="w-full h-11 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl border shadow-md bg-white overflow-hidden">
          <div className="px-6 py-4 border-b bg-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  User Report Data
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Showing {rows.length} {rows.length === 1 ? "user" : "users"}
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Report
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden p-4 space-y-4">
            {rows.length === 0 && (
              <div className="py-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-slate-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-slate-500 font-medium">No users found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your filters
                </p>
              </div>
            )}
            {rows.map((r) => (
              <div
                key={r.userId}
                className="rounded-xl border shadow-md bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 font-semibold">
                      {r.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500">{r.userId}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Email" value={r.email} />
                  <Field label="Phone" value={r.phone} />
                  <Field label="Total loans" value={r.totalLoans} />
                  <Field label="Active" value={r.activeLoans} />
                  <Field label="Overdue" value={r.overdueLoans} />
                  <Field label="Closed" value={r.closedLoans} />
                  <Field
                    label="Outstanding"
                    value={formatINR(r.totalOutstanding)}
                  />
                  <Field
                    label="Disbursed"
                    value={formatINR(r.totalDisbursed)}
                  />
                  <Field
                    label="Last disbursed"
                    value={r.lastDisbursedOn || "—"}
                    full
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>USER</Th>
                  <Th>EMAIL</Th>
                  <Th>PHONE</Th>
                  <Th className="text-right">LOANS</Th>
                  <Th className="text-right">ACTIVE</Th>
                  <Th className="text-right">OVERDUE</Th>
                  <Th className="text-right">CLOSED</Th>
                  <Th className="text-right">OUTSTANDING</Th>
                  <Th className="text-right">DISBURSED</Th>
                  <Th className="text-right">LAST DISBURSED</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 text-center text-gray-500"
                    >
                      No results.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t hover:bg-indigo-50">
                    <Td>
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.userId}</div>
                    </Td>
                    <Td>{r.email}</Td>
                    <Td>{r.phone}</Td>
                    <Td className="text-right">{r.totalLoans}</Td>
                    <Td className="text-right">{r.activeLoans}</Td>
                    <Td className="text-right">{r.overdueLoans}</Td>
                    <Td className="text-right">{r.closedLoans}</Td>
                    <Td className="text-right">
                      {formatINR(r.totalOutstanding)}
                    </Td>
                    <Td className="text-right">
                      {formatINR(r.totalDisbursed)}
                    </Td>
                    <Td className="text-right">{r.lastDisbursedOn || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Small components
// -----------------------------

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={classNames("flex flex-col gap-0.5", full && "col-span-2")}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 truncate">{value}</span>
    </div>
  );
}

function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={classNames(
        "px-4 py-3 text-left font-medium uppercase tracking-wider text-[11px]",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <td className={classNames("px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}
