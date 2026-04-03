"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";

export type InterestMethod =
  | "SIMPLE"
  | "REDUCING"
  | "COMPOUND"
  | "MONTHLY_FLAT";
export type CollateralType =
  | "PROPERTY"
  | "GOLD"
  | "VEHICLE"
  | "CASH_FD"
  | "SECURITIES"
  | "OTHER";
export type CollateralStatus = "PLEDGED" | "RELEASED" | "SEIZED";

export type BorrowerOption = { id: string; label: string };
export type AdminOption = { id: string; label: string };

export type CollateralInput = {
  id?: string;
  type: CollateralType;
  title: string;
  description?: string;
  estimatedValue: number;
  status: CollateralStatus;
  appraisalAt?: string | null; // yyyy-mm-dd
  documentUrls?: string[];
};

// NOTE: adminId is NOT sent from client (server derives from session)
export type CreateLoanInput = {
  borrowerId: string;
  principal: number;
  rate: number;
  months: number;
  startDate: string; // yyyy-mm-dd
  endDate?: string | null;

  interestMethod: InterestMethod;

  lockIn: boolean;
  minMonthsFloor: number;

  isSecured: boolean;
  notes?: string;

  collaterals?: CollateralInput[];
  totalInterest: number;
  totalPayable: number;
};

export function currency(n: number) {
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateLoanInput) => void; // optional: parent can refresh list
  borrowers: BorrowerOption[];
  admin: AdminOption; // display-only
};

export default function CreateLoanForm({
  open,
  onClose,
  onSubmit,
  borrowers,
  admin,
}: Props) {
  const [borrowerId, setBorrowerId] = useState(borrowers[0]?.id ?? "");
  const [principal, setPrincipal] = useState<number>(50000);
  const [users, setUsers] = useState<
    { id: string; userId: string; name: string }[]
  >([]);
  const [rate, setRate] = useState<number>(5.5);
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

  const [collats, setCollats] = useState<CollateralInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ---- Interest calculators (client-side preview) ----
  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // Simple interest (monthly rate): interest = P * (r_monthly) * months
  const calcSimple = useCallback(
    (principal: number, rateMonthly: number, months: number) => {
      const r = rateMonthly / 100; // % per month
      const interest = principal * r * months; // linear, no compounding
      const total = principal + interest;
      const perMonth = months > 0 ? total / months : 0;
      return {
        totalInterest: round2(interest),
        totalPayable: round2(total),
        perMonth: round2(perMonth),
      };
    },
    []
  );

  // MONTHLY FLAT (same math as simple-monthly — kept separate for clarity)
  const calcFlatMonthly = useCallback(
    (principal: number, rateMonthly: number, months: number) => {
      const r = rateMonthly / 100; // % per month
      const interest = principal * r * months;
      const total = principal + interest;
      const perMonth = months > 0 ? total / months : 0;
      return {
        totalInterest: round2(interest),
        totalPayable: round2(total),
        perMonth: round2(perMonth),
      };
    },
    []
  );

  // Compound (monthly compounding, using monthly rate)
  const calcCompound = useCallback(
    (principal: number, rateMonthly: number, months: number) => {
      const r = rateMonthly / 100; // % per month
      const factor = Math.pow(1 + r, months);
      const total = principal * factor;
      const interest = total - principal;
      const perMonth = months > 0 ? total / months : 0; // display only
      return {
        totalInterest: round2(interest),
        totalPayable: round2(total),
        perMonth: round2(perMonth),
      };
    },
    []
  );

  // Reducing (EMI) using monthly rate
  const calcReducing = useCallback(
    (principal: number, rateMonthly: number, months: number) => {
      const r = rateMonthly / 100; // % per month
      if (months <= 0)
        return { totalInterest: 0, totalPayable: 0, perMonth: 0 };
      if (r === 0) {
        const emi = principal / months;
        return {
          totalInterest: 0,
          totalPayable: round2(principal),
          perMonth: round2(emi),
        };
      }
      const pow = Math.pow(1 + r, months);
      const emi = (principal * r * pow) / (pow - 1);
      const totalPayable = emi * months;
      const totalInterest = totalPayable - principal;
      return {
        totalInterest: round2(totalInterest),
        totalPayable: round2(totalPayable),
        perMonth: round2(emi),
      };
    },
    []
  );

  const chargedMonths = useMemo(() => {
    // If lock-in is enabled, charge for full term.
    // If lock-in is disabled, at least minMonthsFloor months interest is charged.
    // Validation already prevents minMonthsFloor > months when !lockIn.
    if (lockIn) return months;
    return minMonthsFloor > 0 ? minMonthsFloor : months;
  }, [lockIn, months, minMonthsFloor]);

  const preview = useMemo(() => {
    switch (interestMethod) {
      case "SIMPLE":
        return calcSimple(principal, rate, chargedMonths);
      case "REDUCING":
        // Using chargedMonths for preview totals per requested policy
        return calcReducing(principal, rate, chargedMonths);
      case "COMPOUND":
        // monthly compounding, balloon at end
        return calcCompound(principal, rate, chargedMonths);
      case "MONTHLY_FLAT":
        // here 'rate' is interpreted as % per month
        return calcFlatMonthly(principal, rate, chargedMonths);
      default:
        return {
          totalInterest: 0,
          totalPayable: 0,
          perMonth: 0,
        };
    }
  }, [
    principal,
    rate,
    chargedMonths,
    interestMethod,
    calcSimple,
    calcReducing,
    calcCompound,
    calcFlatMonthly,
  ]);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/loan/userList");

      if (res.ok) {
        const data = await res.json();
        console.log("this is the reposnse", data);
        setUsers(data);
      }
    }
    fetchUsers();
  }, []);

  function validate(): string | null {
    if (!open) return null;
    if (!borrowerId) return "Select a borrower";
    if (!(principal > 0)) return "Principal must be greater than 0";
    if (!(rate >= 0 && rate <= 100)) return "Rate must be between 0 and 100";
    if (!(months > 0)) return "Months must be greater than 0";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return "Invalid start date";
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return "Invalid end date";
    if (!lockIn && minMonthsFloor > months)
      return "Minimum months cannot exceed total months";
    if (isSecured && collats.some((c) => !c.title.trim()))
      return "Collateral title is required";
    return null;
  }

  function addCollateral() {
    setCollats((p) => [
      ...p,
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
  function updateCollateral(id: string, patch: Partial<CollateralInput>) {
    setCollats((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCollateral(id?: string) {
    setCollats((p) => p.filter((c) => c.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) {
      toast.error(err);
      return;
    }

    const payload: CreateLoanInput = {
      borrowerId,
      principal: Number(principal),
      rate: Number(rate),
      months: Number(months),
      startDate,
      endDate: endDate || null,
      interestMethod,
      lockIn,
      minMonthsFloor: Number(minMonthsFloor),
      isSecured,
      notes: notes || undefined,
      collaterals: isSecured ? collats : [],
      totalInterest: preview.totalInterest,
      totalPayable: preview.totalPayable,
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await res.json().catch(() => ({}));
      // if (!res.ok) {
      //   throw new Error(data?.error || "Failed to create loan");
      // }

      toast.success("Loan created successfully 🎉");
      onSubmit?.(payload);

      // reset minimal fields
      setBorrowerId(borrowers[0]?.id ?? "");
      setPrincipal(50000);
      setRate(5.5);
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
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <style>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>

      {/* Enhanced overlay with gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl bg-white shadow-2xl"
        >
          {/* Header with gradient background */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white text-xl font-semibold shadow-lg">
                  ℒ
                </span>
                <h3 className="text-xl font-bold text-white">
                  Create New Loan
                </h3>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-indigo-600 bg-white hover:bg-gray-50 shadow-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? "Creating…" : "Create Loan"}
                </button>
              </div>
            </div>
          </div>

          {/* Content area with padding */}
          <div className="p-8 space-y-6">
            {/* Loan details section */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Loan Details
                  </h4>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-full">
                    Monthly Rate Mode
                  </span>
                </div>
              </div>

              <div className="p-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Borrower */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Borrower
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Borrower --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.userId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Admin (readonly) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin
                  </label>
                  <input
                    value={admin.label}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-700 shadow-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto-recorded from session
                  </p>
                </div>

                {/* Principal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Principal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                      value={principal}
                      min={0}
                      step="0.01"
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                      placeholder="50000"
                      onWheel={(e) => e.currentTarget.blur()} // 👈 Prevent scroll changing value
                    />
                  </div>
                </div>

                {/* Rate (monthly) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Interest Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      %
                    </span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                      value={rate}
                      min={0}
                      step="0.01"
                      onChange={(e) => setRate(Number(e.target.value))}
                      placeholder="5.00"
                      onWheel={(e) => e.currentTarget.blur()} // 👈 Prevent scroll changing value
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Example: 5 = 5% per month
                  </p>
                </div>

                {/* Months */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loan Term
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                      value={months}
                      min={1}
                      step={1}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      placeholder="6"
                      onWheel={(e) => e.currentTarget.blur()} // 👈 Prevent scroll changing value
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      months
                    </span>
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Interest method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interest Calculation Method
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                    value={interestMethod}
                    onChange={(e) =>
                      setInterestMethod(e.target.value as InterestMethod)
                    }
                  >
                    <option value="SIMPLE">Simple Interest</option>
                    <option value="REDUCING">Reducing Balance</option>
                    <option value="COMPOUND">Compound Interest</option>
                    <option value="MONTHLY_FLAT">Flat Monthly</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Backend will recompute and persist
                  </p>
                </div>
              </div>
            </div>

            {/* Policies & notes section */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Policies & Notes
                </h4>
              </div>

              <div className="p-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Lock-in */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                  <input
                    id="lockin"
                    type="checkbox"
                    checked={lockIn}
                    onChange={(e) => setLockIn(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="lockin"
                    className="text-sm text-gray-700 font-medium leading-tight"
                  >
                    Lock-in Period
                    <span className="block text-xs text-gray-500 font-normal mt-1">
                      Full-term interest charged on early closure
                    </span>
                  </label>
                </div>

                {/* Minimum months floor */}
                {!lockIn && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Months Floor
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={months}
                      step={1}
                      value={minMonthsFloor}
                      onChange={(e) =>
                        setMinMonthsFloor(Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Minimum months charged on early closure
                    </p>
                  </div>
                )}

                {/* Secured */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <input
                    id="secured"
                    type="checkbox"
                    checked={isSecured}
                    onChange={(e) => setIsSecured(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded-lg border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                  />
                  <label
                    htmlFor="secured"
                    className="text-sm text-gray-700 font-medium leading-tight"
                  >
                    Secured Loan
                    <span className="block text-xs text-gray-500 font-normal mt-1">
                      Backed by collateral
                    </span>
                  </label>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400 resize-none"
                    placeholder="Enter any special terms, conditions, or remarks..."
                  />
                </div>
              </div>
            </div>

            {/* Collaterals */}
            {isSecured && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Collateral Items
                    </h4>
                    <button
                      type="button"
                      onClick={addCollateral}
                      className="flex items-center gap-2 text-sm font-semibold rounded-xl border-2 border-amber-200 bg-white px-4 py-2 hover:bg-amber-50 text-amber-700 transition-all"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Collateral
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {collats.length === 0 && (
                    <div className="text-center py-12 px-4 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
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
                      <p className="mt-3 text-sm font-medium text-gray-600">
                        No collateral items added yet
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Click &quot;Add Collateral&quot; to add items
                      </p>
                    </div>
                  )}
                  {collats.map((c) => (
                    <div
                      key={c.id}
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 rounded-xl border-2 border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white hover:border-indigo-200 transition-all"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={c.type}
                          onChange={(e) => {
                            if (!c.id) return;
                            updateCollateral(c.id, {
                              appraisalAt: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
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
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Title / Description
                        </label>
                        <input
                          value={c.title}
                          onChange={(e) => {
                            if (!c.id) return;
                            updateCollateral(c.id, {
                              appraisalAt: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                          placeholder="e.g. Honda Activa"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Estimated Value
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={c.estimatedValue}
                            onChange={(e) => {
                              if (!c.id) return;
                              updateCollateral(c.id, {
                                estimatedValue: Number(e.target.value),
                              });
                            }}
                            className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={c.status}
                          onChange={(e) => {
                            if (!c.id) return;
                            updateCollateral(c.id, {
                              appraisalAt: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        >
                          <option value="PLEDGED">Pledged</option>
                          <option value="RELEASED">Released</option>
                          <option value="SEIZED">Seized</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Appraisal Date
                        </label>
                        <input
                          type="date"
                          value={c.appraisalAt || ""}
                          onChange={(e) => {
                            if (!c.id) return;
                            updateCollateral(c.id, {
                              appraisalAt: e.target.value,
                            });
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeCollateral(c.id)}
                          className="w-full px-3 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview section */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Loan Preview & Summary
                </h4>
              </div>

              <div className="p-6 grid gap-5 sm:grid-cols-3">
                <div className="rounded-xl border-2 border-white p-5 bg-white shadow-md">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Borrower
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {borrowers.find((b) => b.id === borrowerId)?.label ||
                      "Not selected"}
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Admin: {admin.label}
                  </div>
                </div>

                <div className="rounded-xl border-2 border-white p-5 bg-white shadow-md">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Interest Method
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {interestMethod}
                  </div>
                  {interestMethod === "MONTHLY_FLAT" && (
                    <div className="mt-2 px-2 py-1 rounded-lg bg-amber-100 text-xs text-amber-700 font-medium">
                      Flat rate on full principal
                    </div>
                  )}
                  {interestMethod === "COMPOUND" && (
                    <div className="mt-2 px-2 py-1 rounded-lg bg-blue-100 text-xs text-blue-700 font-medium">
                      Monthly compounding
                    </div>
                  )}
                  {interestMethod === "REDUCING" && (
                    <div className="mt-2 px-2 py-1 rounded-lg bg-green-100 text-xs text-green-700 font-medium">
                      Reducing balance EMI
                    </div>
                  )}
                </div>

                <div className="rounded-xl border-2 border-white p-5 bg-white shadow-md">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    Financial Summary
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-medium text-gray-600">
                        Total Interest
                      </span>
                      <span className="text-sm font-bold text-indigo-600">
                        {currency(preview.totalInterest ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-medium text-gray-600">
                        Total Payable
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {currency(preview.totalPayable ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        Monthly EMI
                      </span>
                      <span className="text-sm font-bold text-pink-600">
                        {preview.perMonth ? currency(preview.perMonth) : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-600">
                    {lockIn ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-medium">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v7a2 2 0 002 2h8a2 2 0 002-2v-7a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" />
                        </svg>
                        Lock-in active: totals charged for full term ({months}{" "}
                        months)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-medium">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 3a1 1 0 01.894.553l.447.894.988.144a1 1 0 01.555 1.705l-.714.696.168.98a1 1 0 01-1.451 1.054L10 9.347l-.887.467a1 1 0 01-1.451-1.054l.168-.98-.714-.696a1 1 0 01.555-1.705l.988-.144.447-.894A1 1 0 0110 3z" />
                        </svg>
                        Min months floor applied: {Math.max(1, minMonthsFloor)}{" "}
                        month{Math.max(1, minMonthsFloor) !== 1 ? "s" : ""} used
                        for totals
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-[10px] text-gray-500 leading-tight">
                    Figures are estimates. Final schedule generated after
                    creation.
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            {/* Terms & Conditions (compact, bilingual) */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-indigo-600"
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
                  Terms & Conditions / नियम व शर्तें
                </h4>
                <span className="text-[11px] text-gray-500">
                  Short summary • Detailed page in Settings
                </span>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {/* English */}
                <ul className="text-xs sm:text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>
                    <strong>Monthly interest</strong>: All loans charge{" "}
                    <em>monthly</em> interest; rates shown are per month, not
                    per year.
                  </li>
                  <li>
                    <strong>Lock-in period</strong>: If enabled, interest is
                    charged for the <em>full term</em> even on early closure.
                  </li>
                  <li>
                    <strong>Minimum months</strong>: If lock-in is off, at least
                    the configured minimum months of interest will be charged.
                    Delays add interest month-wise.
                  </li>
                  <li>
                    <strong>Collateral</strong>: For secured loans, collateral
                    details (type, title, status, appraisal date) must be
                    accurate; mismatches can delay approval/release.
                  </li>
                </ul>
                {/* Hindi */}
                <ul className="text-xs sm:text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>
                    <strong>मासिक ब्याज</strong>: सभी लोन पर <em>मासिक</em>{" "}
                    ब्याज लगता है; दिखाया गया रेट प्रति माह है, प्रति वर्ष नहीं।
                  </li>
                  <li>
                    <strong>लॉक-इन अवधि</strong>: सक्षम होने पर, जल्दी क्लोज
                    करने पर भी पूरे टर्म का ब्याज लगेगा।
                  </li>
                  <li>
                    <strong>न्यूनतम महीने</strong>: लॉक-इन बंद होने पर भी
                    कम-से-कम निर्धारित महीनों का ब्याज देना होगा। देरी होने पर
                    महीने‑वार ब्याज जुड़ता रहेगा।
                  </li>
                  <li>
                    <strong>कोलैटरल</strong>: सिक्योर्ड लोन में कोलैटरल (प्रकार,
                    शीर्षक, स्टेटस, एप्रेज़ल तिथि) सही भरें; गलती होने पर
                    स्वीकृति/रिलीज़ में देरी हो सकती है।
                  </li>
                </ul>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  Interest methods: Simple • Reducing (EMI) • Compound • Monthly
                  Flat
                </span>
                <a href="/settings" className="text-indigo-600 hover:underline">
                  View full terms
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
