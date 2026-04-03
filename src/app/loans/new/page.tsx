"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type InterestMethod = "SIMPLE" | "REDUCING" | "COMPOUND" | "FLAT MONTHLY";
type LoanStatus = "ACTIVE" | "CLOSED";
type CollateralType =
  | "PROPERTY"
  | "GOLD"
  | "VEHICLE"
  | "CASH_FD"
  | "SECURITIES"
  | "OTHER";
type CollateralStatus = "PLEDGED" | "RELEASED" | "SEIZED";

type LoanRow = {
  id: string;

  borrowerId: string;
  borrowerLabel: string;

  adminId: string;
  adminLabel: string;

  principal: number; // Decimal in DB
  rate: number; // Decimal in DB
  months: number;
  startDate: string; // ISO yyyy-mm-dd
  endDate?: string | null;

  interestMethod: InterestMethod;

  lockIn: boolean;
  minMonthsFloor: number;

  status: LoanStatus;

  totalInterest?: number | null;
  totalPayable?: number | null;

  notes?: string | null;

  isSecured: boolean;
  collaterals: {
    id: string;
    type: CollateralType;
    title: string;
    description?: string;
    estimatedValue: number;
    status: CollateralStatus;
    appraisalAt?: string | null; // ISO date
    documentUrls?: string[];
  }[];
};

const currency = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const uid = () => Math.random().toString(36).slice(2, 9);

// Dummy users & current admin for the demo
const USERS = [
  { id: "userX", label: "User X" },
  { id: "userY", label: "User Y" },
  { id: "userZ", label: "User Z" },
];

const CURRENT_ADMIN = { id: "adminA", label: "Admin A" };

const SEED: LoanRow[] = [
  {
    id: "L1",
    borrowerId: "userX",
    borrowerLabel: "User X",
    adminId: CURRENT_ADMIN.id,
    adminLabel: CURRENT_ADMIN.label,
    principal: 50000,
    rate: 4,
    months: 12,
    startDate: "2025-01-01",
    endDate: null,
    interestMethod: "SIMPLE",
    lockIn: false,
    minMonthsFloor: 0,
    status: "ACTIVE",
    totalInterest: Math.round(50000 * 0.04 * 1 * 100) / 100,
    totalPayable: Math.round((50000 + 50000 * 0.04 * 1) * 100) / 100,
    notes: "Seed example",
    isSecured: false,
    collaterals: [],
  },
];

export default function LoansClient() {
  const [loans, setLoans] = useState<LoanRow[]>(SEED);
  const [q, setQ] = useState("");

  // Toggle form
  const [showForm, setShowForm] = useState(false);

  // Form state (mapped to schema)
  const [borrowerId, setBorrowerId] = useState(USERS[0].id);
  const [principal, setPrincipal] = useState<number>(50000);
  const [rate, setRate] = useState<number>(4.0);
  const [months, setMonths] = useState<number>(12);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>("");
  const [interestMethod, setInterestMethod] =
    useState<InterestMethod>("SIMPLE");
  const [lockIn, setLockIn] = useState<boolean>(false);
  const [minMonthsFloor, setMinMonthsFloor] = useState<number>(0);
  const [isSecured, setIsSecured] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Collaterals
  type Collat = LoanRow["collaterals"][number];
  const [collats, setCollats] = useState<Collat[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Preview (only SIMPLE interest is computed client-side)
  const preview = useMemo(() => {
    if (interestMethod !== "SIMPLE") {
      return {
        totalInterest: null as number | null,
        totalPayable: null as number | null,
        perMonth: null as number | null,
      };
    }
    const interest = principal * (rate / 100) * (months / 12);
    const total = principal + interest;
    const perMonth = months > 0 ? total / months : 0;
    return {
      totalInterest: Math.round(interest * 100) / 100,
      totalPayable: Math.round(total * 100) / 100,
      perMonth: Math.round(perMonth * 100) / 100,
    };
  }, [principal, rate, months, interestMethod]);

  const filtered = useMemo(() => {
    if (!q.trim()) return loans;
    const s = q.toLowerCase();
    return loans.filter(
      (l) =>
        l.borrowerLabel.toLowerCase().includes(s) ||
        l.adminLabel.toLowerCase().includes(s) ||
        String(l.principal).includes(s) ||
        String(l.rate).includes(s) ||
        l.interestMethod.toLowerCase().includes(s)
    );
  }, [q, loans]);

  function validate(): string | null {
    if (!borrowerId) return "Select a borrower";
    if (!(principal > 0)) return "Principal must be greater than 0";
    if (!(rate >= 0 && rate <= 100)) return "Rate must be between 0 and 100";
    if (!(months > 0)) return "Months must be greater than 0";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return "Invalid start date";
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return "Invalid end date";
    if (!lockIn && minMonthsFloor > months)
      return "Minimum months cannot exceed total months";
    return null;
  }

  function resetForm() {
    setBorrowerId(USERS[0].id);
    setPrincipal(50000);
    setRate(4.0);
    setMonths(12);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setInterestMethod("SIMPLE");
    setLockIn(false);
    setMinMonthsFloor(0);
    setIsSecured(false);
    setNotes("");
    setCollats([]);
    setError(null);
  }

  function onCancel() {
    resetForm();
    setShowForm(false);
  }

  function addCollateral() {
    setCollats((prev) => [
      ...prev,
      {
        id: uid(),
        type: "OTHER",
        title: "",
        description: "",
        estimatedValue: 0,
        status: "PLEDGED",
        appraisalAt: "",
        documentUrls: [],
      },
    ]);
  }

  function updateCollateral(id: string, patch: Partial<Collat>) {
    setCollats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeCollateral(id: string) {
    setCollats((prev) => prev.filter((c) => c.id !== id));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    const borrower = USERS.find((u) => u.id === borrowerId)!;

    const newRow: LoanRow = {
      id: uid(),
      borrowerId,
      borrowerLabel: borrower.label,
      adminId: CURRENT_ADMIN.id,
      adminLabel: CURRENT_ADMIN.label,
      principal: Number(principal),
      rate: Number(rate),
      months: Number(months),
      startDate,
      endDate: endDate || null,
      interestMethod,
      lockIn,
      minMonthsFloor: Number(minMonthsFloor),
      status: "ACTIVE",
      totalInterest: preview.totalInterest,
      totalPayable: preview.totalPayable,
      notes: notes || null,
      isSecured,
      collaterals: isSecured ? collats : [],
    };

    setLoans((prev) => [newRow, ...prev]);
    resetForm();
    setShowForm(false);
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
              Create a loan (per schema) and view all loans.
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
                placeholder="Search by borrower, admin, principal, method"
                className="pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              + New Loan
            </button>
          </div>
        </div>
      </div>

      {/* Create Loan Form (inline card) */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border shadow-sm p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Create Loan
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow text-sm"
              >
                Create Loan
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Borrower */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Borrower
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
              >
                {USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin (readonly for now) */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Admin</label>
              <input
                value={CURRENT_ADMIN.label}
                readOnly
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-900"
              />
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
                  step="0.01"
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Rate (% p.a.)
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
                  step="0.01"
                  onChange={(e) => setRate(Number(e.target.value))}
                  placeholder="5.50"
                />
              </div>
            </div>

            {/* Months */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Term (months)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={months}
                min={1}
                step="1"
                onChange={(e) => setMonths(Number(e.target.value))}
                placeholder="6"
              />
            </div>

            {/* Start / End */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End date (optional)
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Interest method */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Interest method
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={interestMethod}
                onChange={(e) =>
                  setInterestMethod(e.target.value as InterestMethod)
                }
              >
                <option value="SIMPLE">Simple</option>
                <option value="REDUCING">Reducing</option>
                <option value="COMPOUND">Compound</option>
                <option value="FLAT MONTHLY">Flat Monthly</option>
              </select>
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

            {/* Minimum months floor */}
            {!lockIn && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Minimum months if closed early
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
              </div>
            )}

            {/* Secured */}
            <div className="flex items-center gap-2">
              <input
                id="secured"
                type="checkbox"
                checked={isSecured}
                onChange={(e) => setIsSecured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="secured" className="text-sm text-gray-700">
                Secured (with collateral)
              </label>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-sm text-gray-600 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special terms…"
              />
            </div>
          </div>

          {/* Collaterals */}
          {isSecured && (
            <div className="mt-5 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Collaterals</h4>
                <button
                  type="button"
                  onClick={addCollateral}
                  className="text-sm rounded-md border px-2.5 py-1 hover:bg-gray-50"
                >
                  + Add item
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {collats.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No collateral added yet.
                  </p>
                )}
                {collats.map((c) => (
                  <div
                    key={c.id}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 rounded-lg border p-3"
                  >
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={c.type}
                        onChange={(e) =>
                          updateCollateral(c.id, {
                            type: e.target.value as CollateralType,
                          })
                        }
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      >
                        <option value="PROPERTY">Property</option>
                        <option value="GOLD">Gold</option>
                        <option value="VEHICLE">Vehicle</option>
                        <option value="CASH_FD">Cash / FD</option>
                        <option value="SECURITIES">Securities</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Title
                      </label>
                      <input
                        value={c.title}
                        onChange={(e) =>
                          updateCollateral(c.id, { title: e.target.value })
                        }
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                        placeholder="e.g. Honda Activa"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Estimated Value (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={c.estimatedValue}
                        onChange={(e) =>
                          updateCollateral(c.id, {
                            estimatedValue: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Status
                      </label>
                      <select
                        value={c.status}
                        onChange={(e) =>
                          updateCollateral(c.id, {
                            status: e.target.value as CollateralStatus,
                          })
                        }
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      >
                        <option value="PLEDGED">Pledged</option>
                        <option value="RELEASED">Released</option>
                        <option value="SEIZED">Seized</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Appraisal Date
                      </label>
                      <input
                        type="date"
                        value={c.appraisalAt || ""}
                        onChange={(e) =>
                          updateCollateral(c.id, {
                            appraisalAt: e.target.value,
                          })
                        }
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => removeCollateral(c.id)}
                        className="text-sm text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">Borrower</div>
              <div className="text-lg font-semibold text-gray-900">
                {USERS.find((u) => u.id === borrowerId)?.label}{" "}
                <span className="text-xs text-gray-500">
                  ({CURRENT_ADMIN.label})
                </span>
              </div>
            </div>

            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">Method</div>
              <div className="text-lg font-semibold text-gray-900">
                {interestMethod}
              </div>
              {interestMethod !== "SIMPLE" && (
                <div className="mt-1 text-xs text-gray-500">
                  Interest will be computed on backend for{" "}
                  {interestMethod.toLowerCase()}.
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm text-gray-600">Totals</div>
              {interestMethod === "SIMPLE" ? (
                <div className="text-lg font-semibold text-gray-900">
                  {currency(preview.totalPayable ?? 0)}{" "}
                  <span className="text-sm text-gray-600">
                    •{" "}
                    {(preview.perMonth ?? 0) > 0
                      ? `${currency(preview.perMonth!)}/mo`
                      : ""}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Calculated after creation
                </div>
              )}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
