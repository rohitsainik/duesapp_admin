"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type LoanRow = {
  id: string;
  userId: string; // for deep-linking to user report
  user: string;
  admin: string;
  principal: number;
  rate: number; // annualRatePct
  months: number; // termMonths
  interest: number; // computed simple interest
  total: number; // principal + interest
  status: "ACTIVE" | "CLOSED";
  start?: string;
  lockIn?: boolean; // NEW: if true, charge full-term interest even on early payoff
  minMonthsFloor?: number; // NEW: if not lock-in, minimum months of interest to charge on early payoff
};

const currency = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const uid = () => Math.random().toString(36).slice(2, 9);

const USERS = [
  { id: "userX", label: "User X", admin: "Admin A" },
  { id: "userY", label: "User Y", admin: "Admin A" },
  { id: "userZ", label: "User Z", admin: "Admin A" },
];

const SEED: LoanRow[] = [
  {
    id: "L1",
    userId: "userX",
    user: "User X",
    admin: "Admin A",
    principal: 50000,
    rate: 4,
    months: 12,
    interest: Math.round(50000 * 0.04 * 1 * 100) / 100,
    total: Math.round((50000 + 50000 * 0.04 * 1) * 100) / 100,
    status: "ACTIVE",
    start: "2025-01-01",
  },
  {
    id: "L2",
    userId: "userY",
    user: "User Y",
    admin: "Admin A",
    principal: 100000,
    rate: 5,
    months: 12,
    interest: Math.round(100000 * 0.05 * 1 * 100) / 100,
    total: Math.round((100000 + 100000 * 0.05 * 1) * 100) / 100,
    status: "ACTIVE",
    start: "2025-01-01",
  },
  {
    id: "L3",
    userId: "userZ",
    user: "User Z",
    admin: "Admin A",
    principal: 80000,
    rate: 4,
    months: 12,
    interest: Math.round(80000 * 0.04 * 1 * 100) / 100,
    total: Math.round((80000 + 80000 * 0.04 * 1) * 100) / 100,
    status: "ACTIVE",
    start: "2025-01-01",
  },
];

export default function LoansClient() {
  const [loans, setLoans] = useState<LoanRow[]>(SEED);
  const [q, setQ] = useState("");

  // Toggle inline form
  const [showNewForm, setShowNewForm] = useState(false);

  // Create form state
  const [selectedUser, setSelectedUser] = useState(USERS[0].id);
  const [principal, setPrincipal] = useState<number>(50000);
  const [rate, setRate] = useState<number>(4);
  const [months, setMonths] = useState<number>(12);
  const [start, setStart] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [lockIn, setLockIn] = useState<boolean>(false); // NEW
  const [minMonthsFloor, setMinMonthsFloor] = useState<number>(0); // NEW
  const [error, setError] = useState<string | null>(null);

  const selectedUserObj = USERS.find((u) => u.id === selectedUser)!;

  // Simple interest preview
  const preview = useMemo(() => {
    const interest = principal * (rate / 100) * (months / 12);
    const total = principal + interest;
    const perMonth = months > 0 ? total / months : 0;
    return {
      interest: Math.round(interest * 100) / 100,
      total: Math.round(total * 100) / 100,
      perMonth: Math.round(perMonth * 100) / 100,
    };
  }, [principal, rate, months]);

  const filtered = useMemo(() => {
    if (!q.trim()) return loans;
    const s = q.toLowerCase();
    return loans.filter(
      (l) =>
        l.user.toLowerCase().includes(s) ||
        l.admin.toLowerCase().includes(s) ||
        String(l.principal).includes(s) ||
        String(l.rate).includes(s)
    );
  }, [q, loans]);

  function validate(): string | null {
    if (!selectedUser) return "Select a user";
    if (!(principal > 0)) return "Principal must be greater than 0";
    if (!(rate >= 0 && rate <= 100)) return "Rate must be between 0 and 100";
    if (!(months > 0)) return "Months must be greater than 0";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return "Invalid start date";
    return null;
  }

  function addLoan(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    const userObj = USERS.find((u) => u.id === selectedUser)!;

    const row: LoanRow = {
      id: uid(),
      userId: userObj.id,
      user: userObj.label,
      admin: userObj.admin,
      principal: Number(principal),
      rate: Number(rate),
      months: Number(months),
      interest: preview.interest,
      total: preview.total,
      status: "ACTIVE",
      start,
      lockIn,
      minMonthsFloor: Number(minMonthsFloor),
    };

    setLoans((prev) => [row, ...prev]);
    setShowNewForm(false);
    // reset minimal fields
    setPrincipal(50000);
    setRate(4);
    setMonths(12);
    setStart(new Date().toISOString().slice(0, 10));
    setLockIn(false);
    setMinMonthsFloor(0);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Header / Filters */}
      <div className="rounded-2xl border shadow-sm p-4 bg-gradient-to-r from-white to-gray-50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Loans
            </h2>
            <p className="text-sm text-gray-600">
              Create a loan with simple interest and view all loans.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search loans by user, admin, principal or rate"
                className="pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowNewForm((s) => !s)}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              {showNewForm ? "Close" : "+ New Loan"}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Create Loan Card (toggle) */}
      {showNewForm && (
        <form
          onSubmit={addLoan}
          className="bg-white rounded-2xl border shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Create Loan
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* User */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Party (User)
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                {USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} — {u.admin}
                  </option>
                ))}
              </select>
            </div>

            {/* Principal */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Principal (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ₹
                </span>
                <input
                  type="number"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={principal}
                  min={0}
                  step="any"
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Rate (%) per year
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  %
                </span>
                <input
                  type="number"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={rate}
                  min={0}
                  step="0.1"
                  onChange={(e) => setRate(Number(e.target.value))}
                  placeholder="4.0"
                />
              </div>
            </div>

            {/* Months */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Term (months)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ⌛
                </span>
                <input
                  type="number"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={months}
                  min={1}
                  step="1"
                  onChange={(e) => setMonths(Number(e.target.value))}
                  placeholder="12"
                />
              </div>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            {/* Lock-in */}
            <div className="flex items-center gap-2">
              <input
                id="lockin"
                type="checkbox"
                checked={lockIn}
                onChange={(e) => setLockIn(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="lockin" className="text-sm text-gray-700">
                Lock-in (pay full-term interest even if closed early)
              </label>
            </div>

            {/* Minimum months floor (only when not lock-in) */}
            {!lockIn && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Minimum months to charge if closed early
                </label>
                <input
                  type="number"
                  min={0}
                  max={months}
                  step={1}
                  value={minMonthsFloor}
                  onChange={(e) => setMinMonthsFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If user clears early, charge at least this many months of
                  interest.
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">User</div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedUserObj.label}{" "}
                <span className="text-xs text-gray-500">
                  ({selectedUserObj.admin})
                </span>
              </div>
            </div>
            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">Interest (simple)</div>
              <div className="text-lg font-semibold text-gray-900">
                {currency(preview.interest)}
              </div>
              <div className="mt-2 h-1 rounded bg-amber-100">
                <div
                  className="h-full bg-amber-600 rounded"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">Total / Per Month</div>
              <div className="text-lg font-semibold text-gray-900">
                {currency(preview.total)}{" "}
                <span className="text-sm text-gray-600">
                  • {currency(preview.perMonth)}/mo
                </span>
              </div>
              <div className="mt-2 h-1 rounded bg-blue-100">
                <div
                  className="h-full bg-blue-600 rounded"
                  style={{ width: "75%" }}
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow">
              Create Loan
            </button>
            <span className="text-xs text-gray-500">
              Static UI — no backend calls yet
            </span>
          </div>
        </form>
      )}

      {/* Loans Table Card */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">All Loans</h3>
          <div className="text-xs text-gray-500">Total: {loans.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 text-gray-600">User</th>
                <th className="px-3 py-2 text-gray-600">Admin</th>
                <th className="px-3 py-2 text-gray-600">Principal</th>
                <th className="px-3 py-2 text-gray-600">Rate (%)</th>
                <th className="px-3 py-2 text-gray-600">Months</th>
                <th className="px-3 py-2 text-gray-600">Interest</th>
                <th className="px-3 py-2 text-gray-600">Total</th>
                <th className="px-3 py-2 text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => (
                <tr
                  key={l.id}
                  className={`border-t ${
                    idx % 2 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50/40 transition-colors`}
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/users/${l.userId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {l.user}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-800">{l.admin}</td>
                  <td className="px-3 py-2 text-gray-800">
                    {currency(l.principal)}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{l.rate}</td>
                  <td className="px-3 py-2 text-gray-800">{l.months}</td>
                  <td className="px-3 py-2 text-gray-800">
                    {currency(l.interest)}
                  </td>
                  <td className="px-3 py-2 text-gray-800">
                    {currency(l.total)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs border ${
                        l.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-gray-500"
                    colSpan={8}
                  >
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
