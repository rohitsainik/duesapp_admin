"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import CreateLoanForm, {
  CreateLoanInput,
  BorrowerOption,
  AdminOption,
} from "@/components/loans/LoanForm";

type LoanRow = {
  id: string;
  userId: string; // borrower DB id
  userCode?: string;
  user: string;
  admin: string;
  principal: number;
  rate: number;
  months: number;
  interest: number;
  total: number;
  status: "ACTIVE" | "CLOSED";
  createdAt?: string;
  // totalInterest:number
};

const currency = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export function LoansClient() {
  const { data: session } = useSession();
  const adminName = session?.user?.name ?? "Admin";
  const adminId = session?.user?.id ?? "";
  const CURRENT_ADMIN: AdminOption = { id: adminId, label: adminName };

  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerOption[]>([]);
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // fetch everything from ONE API
  async function loadLoansAndBorrowers() {
    setLoading(true);
    try {
      const res = await fetch("/api/loan/getLoanAdminUser", {
        cache: "no-store",
      });
      console.log("this is the response", res);

      if (!res.ok) {
        setLoans([]);
        setBorrowers([]);
        setLoading(false);
        return;
      }

      // shape: [{ id, userId, name, loansBorrowed: [...] }]
      const data: Array<{
        id: string;
        userId: string;
        name: string;
        loansBorrowed: Array<{
          id: string;
          principal: number;
          rate: number;
          months: number;
          status: "ACTIVE" | "CLOSED";
          totalPayable?: number;
          createdAt?: string;
          totalInterest: number;
        }>;
      }> = await res.json();

      console.log("this is the loan data", data);

      // Borrowers dropdown
      const borrowerOpts: BorrowerOption[] = data.map((u) => ({
        id: u.id,
        label: `${u.name} (${u.userId})`,
      }));
      setBorrowers(borrowerOpts);

      // Flatten loans for table

      const flatLoans: LoanRow[] = data.flatMap((u) =>
        u.loansBorrowed.map((l) => {
          // Prefer persisted totals from backend (sent by frontend). Fallback to simple interest estimate.
          const totalInterestRaw =
            typeof l.totalInterest === "number"
              ? l.totalInterest
              : l.principal * (l.rate / 100) * (l.months / 12);

          const totalRaw =
            typeof l.totalPayable === "number"
              ? l.totalPayable
              : l.principal + totalInterestRaw;
          const total = l.totalPayable || 0;

          return {
            id: l.id,
            userId: u.id,
            userCode: u.userId,
            user: u.name,
            admin: adminName,
            principal: l.principal,
            rate: l.rate,
            months: l.months,
            interest: l.totalInterest,
            total: total,
            status: l.status,
            createdAt: l.createdAt,
          };
        })
      );
      console.log("this is the flat loans data", flatLoans);

      setLoans(flatLoans);
    } catch {
      setLoans([]);
      setBorrowers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoansAndBorrowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return loans;
    const s = q.toLowerCase();
    return loans.filter(
      (l) =>
        l.user.toLowerCase().includes(s) ||
        l.admin.toLowerCase().includes(s) ||
        (l.userCode?.toLowerCase().includes(s) ?? false) ||
        String(l.principal).includes(s) ||
        String(l.rate).includes(s)
    );
  }, [q, loans]);

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="rounded-xl border border-gray-200 shadow-md overflow-hidden bg-white">
        <div className="bg-indigo-500 px-4 py-3">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Loan Management
            </h2>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Create and manage loans with flexible interest calculations.
                Track all loans under your account with comprehensive details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search loans..."
                  className="w-full sm:w-60 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                onClick={() => setOpenForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Loan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              All Loans
            </h3>
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    className="animate-spin h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  Total: {loans.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rate (%)
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Interest
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!loading &&
                filtered.map((l, idx) => (
                  <tr
                    key={l.id}
                    className={`${
                      idx % 2 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/admin/loans/${l.userId}`}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm group"
                      >
                        <svg
                          className="w-4 h-4 opacity-60 group-hover:opacity-100"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {l.user}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                        {l.userCode ?? "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700">
                      {l.admin}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {currency(l.principal)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-indigo-600">
                        {l.rate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        {l.months}
                        <span className="text-[10px] opacity-75">mo</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-purple-600">
                        {currency(l.interest)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {currency(l.total)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          l.status === "ACTIVE"
                            ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            l.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-gray-500"
                          }`}
                        ></span>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-10 text-center" colSpan={9}>
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-16 h-16 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-base font-semibold text-gray-600">
                          No loans found
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Try adjusting your search or create a new loan
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td className="px-3 py-10 text-center" colSpan={9}>
                    <div className="flex flex-col items-center gap-4">
                      <svg
                        className="animate-spin h-10 w-10 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-base font-medium text-gray-600">
                        Loading loans...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Loan */}
      <CreateLoanForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        borrowers={borrowers}
        admin={CURRENT_ADMIN}
      />
    </div>
  );
}
