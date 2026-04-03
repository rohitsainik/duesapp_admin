"use client";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import EditLoan from "../loans/EditLoan";

// ---------- Types ----------
type LoanPolicy = {
  dueDay?: number; // due on this day each month (1..28); default 10
  graceDays?: number; // no late fee within grace; default 3
  lateFeeFlat?: number; // ₹ fixed late fee if overdue; default 100
  lateFeePct?: number; // % of installment amount as late fee; default 0.01 (1%)
  allowEarlyPayoff?: boolean; // early closure allowed; default true
};

type Loan = {
  id: string;
  principal: number;
  rate: number; // annual %
  months: number; // term
  start: string; // ISO yyyy-mm-dd (loan start date)
  policy?: LoanPolicy;
  interestMethod: string;
  totalInterest: number;
  totalPayable: number;
  depositedPrincipal?: number;
  depositedInterest?: number;
  status: string;
};

type Receipt = {
  id: string;
  loanId: string;
  date: string; // ISO
  amount: number;
  recordedBy: string;
  note?: string;
  targetIdx?: number; // Optional: targets a specific installment (1-based)
  depositedAt?: string; // Optional: displayable IST timestamp
  principal: number;
  // Added for API-aligned tracking
  depositPrincipal?: number | null;
  depositInterest?: number | null;
};

// ---------- Utils ----------
const inr = (n: number | string) =>
  Number(n).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

// ---------- Component ----------
type UserMeta = { id: string; name: string; email: string; admin: string };
type UserLoanReportProps = {
  userId: string;
  userMeta: UserMeta;
  loans: Loan[];
  receipts: Receipt[];
};

export function UserLoanReport({
  userId,
  userMeta,
  loans,
  receipts: receiptsProp,
}: UserLoanReportProps) {
  const todayISO = new Date().toISOString().slice(0, 10);

  // Local state for receipts (for manual add/mark paid UI)
  const [receipts, setReceipts] = useState<Receipt[]>(receiptsProp);

  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  async function handleConfirmClear(loanId: string) {
    try {
      setClearing(true);
      const res = await fetch("/api/loan/clearLoan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId }),
      });
      const data = await res.json();
      console.log("this is the response", res);

      if (!res.ok) throw new Error(data?.error || "Failed to clear loan");
      toast.success("Loan cleared successfully ✅");
      setShowClearConfirm(null);
      await loadReceipts();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setClearing(false);
    }
  }

  // Helper to fetch receipts from API
  async function loadReceipts() {
    try {
      const res = await fetch(`/api/loan/getLoanDetails?userId=${userId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReceipts(Array.isArray(data?.receipts) ? data.receipts : []);
    } catch (e) {
      console.error("Failed to load receipts", e);
    }
  }
  React.useEffect(() => {
    loadReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Table totals (aggregated sums across all loans)
  const tableTotals = useMemo(() => {
    const principal = loans.reduce((s, l) => s + (l.principal || 0), 0);
    const interest = loans.reduce((s, l) => s + (l.totalInterest || 0), 0);
    const totalAmount = loans.reduce((s, l) => s + (l.totalPayable || 0), 0);
    const depoP = loans.reduce((s, l) => s + (l.depositedPrincipal || 0), 0);
    const depoI = loans.reduce((s, l) => s + (l.depositedInterest || 0), 0);
    const due = loans.reduce(
      (s, l) =>
        s +
        Math.max(
          (l.totalPayable || 0) -
            ((l.depositedPrincipal || 0) + (l.depositedInterest || 0)),
          0
        ),
      0
    );
    return { principal, interest, totalAmount, depoP, depoI, due };
  }, [loans]);

  // Totals (backend only, no client-side calculations)
  const totals = useMemo(() => {
    const principal = loans.reduce((s, l) => s + (l.principal || 0), 0);
    const interest = loans.reduce((s, l) => s + (l.totalInterest || 0), 0);
    const payable = loans.reduce((s, l) => s + (l.totalPayable || 0), 0);
    const depositedPrincipal = loans.reduce(
      (s, l) => s + (l.depositedPrincipal || 0),
      0
    );
    const depositedInterest = loans.reduce(
      (s, l) => s + (l.depositedInterest || 0),
      0
    );
    const received = depositedPrincipal + depositedInterest;
    const remaining = Math.max(payable - received, 0);
    const progressPct =
      payable > 0 ? Math.min((received / payable) * 100, 100) : 0;
    return {
      principal,
      interest,
      payable,
      depositedPrincipal,
      depositedInterest,
      received,
      remaining,
      progressPct,
    };
  }, [loans]);

  // Add receipt form + quick action
  const [newLoanId, setNewLoanId] = useState(loans[0]?.id ?? "");
  const [newPrincipalPart, setNewPrincipalPart] = useState<number>(0);
  const [newInterestPart, setNewInterestPart] = useState<number>(0);
  const [newNote, setNewNote] = useState<string>("");

  const totalNewAmount = Math.max(
    0,
    round2((newPrincipalPart || 0) + (newInterestPart || 0))
  );

  // Reset principal/interest fields when loan changes
  React.useEffect(() => {
    setNewPrincipalPart(0);
    setNewInterestPart(0);
  }, [newLoanId]);

  // Sync receipts state to prop if receiptsProp changes (for external updates)
  React.useEffect(() => {
    setReceipts(receiptsProp);
  }, [receiptsProp]);

  async function addReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!newLoanId) return;
    const loan = loans.find((l) => l.id === newLoanId);
    if (!loan) return;

    const principal = Number(newPrincipalPart || 0);
    const interest = Number(newInterestPart || 0);
    if (principal < 0 || interest < 0) return;
    if (principal === 0 && interest === 0) return;

    // Build payload for API (adminUserId comes from session on the server)
    const payload = {
      loanId: newLoanId,
      depositPrincipal: principal,
      depositInterest: interest,
      note: (newNote || "").trim() || undefined,
    };

    const res = await fetch("/api/loan/depositLoan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to record deposit", await res.text());
      alert("Failed to record deposit");
      return;
    }

    await loadReceipts();

    // reset fields
    setNewPrincipalPart(0);
    setNewInterestPart(0);
    setNewNote("");
  }

  return (
    <section className="space-y-6 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* KPI row */}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <KPI
          label="Total Principal"
          value={inr(totals.principal)}
          tone="emerald"
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3-1.79-3-4-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12c0-4.418 3.582-8 8-8 2.485 0 4.727 1.134 6.2 2.91M19 12c0 4.418-3.582 8-8 8-2.485 0-4.727-1.134-6.2-2.91"
              />
            </svg>
          }
        />
        <KPI
          label="Total Interest"
          value={inr(totals.interest)}
          tone="amber"
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v18m6-6H6"
              />
            </svg>
          }
        />
        <KPI
          label="Total Payable"
          value={inr(totals.payable)}
          tone="indigo"
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18M5 6h14M4 14h16M6 18h12"
              />
            </svg>
          }
        />
        <KPI
          label="Deposited Principal"
          value={inr(totals.depositedPrincipal)}
          tone="teal"
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />
        <KPI
          label="Deposited Interest"
          value={inr(totals.depositedInterest)}
          tone="purple"
          icon={
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v8m-4-4h8"
              />
            </svg>
          }
        />

        {/* Progress (enhanced) */}
        <div className="rounded-2xl p-5 shadow-md border bg-white sm:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-[13px] sm:text-sm text-gray-600">Progress</div>
            {totals.remaining === 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {Math.round(totals.progressPct)}%
              </span>
            )}
          </div>

          {/* line-type progress */}
          <div className="mt-3 h-2.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={
                "h-full rounded-full transition-all " +
                (totals.remaining === 0
                  ? "bg-gradient-to-r from-emerald-500 to-green-600"
                  : totals.progressPct < 40
                  ? "bg-gradient-to-r from-rose-400 to-amber-500"
                  : totals.progressPct < 80
                  ? "bg-gradient-to-r from-indigo-500 to-blue-600"
                  : "bg-gradient-to-r from-emerald-500 to-green-600")
              }
              style={{ width: `${totals.progressPct}%` }}
            />
          </div>

          {/* chips for received & remaining */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 13.414l4.707-4.707z" />
              </svg>
              Received: {inr(totals.received)}
            </span>

            <span
              className={
                "inline-flex items-center gap-1 px-2 py-1 rounded-md border " +
                (totals.remaining === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-100")
              }
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3a7 7 0 100 14A7 7 0 0010 3zM9 5h2v5H9V5zm0 6h2v2H9v-2z" />
              </svg>
              Remaining: {inr(totals.remaining)}
            </span>
          </div>

          {/* tiny accent line that turns green on clear */}
          <div
            className={
              "mt-3 h-px w-full " +
              (totals.remaining === 0
                ? "bg-emerald-300"
                : "bg-gradient-to-r from-indigo-200 via-blue-200 to-rose-200")
            }
          />
          {totals.remaining === 0 && (
            <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              All dues cleared. Great job!
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
        {/* Scrollable container with custom scrollbar */}
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
          <table className="min-w-full w-max text-[13px]">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b-2 border-gray-200 shadow-sm">
              <tr className="text-left text-gray-700">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">#</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Start
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Principal
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Rate (%)
                </th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                  Months
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Method
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Depo. Principal
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Total Interest
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Depo. Interest
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Due
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Action
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Edit Loan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan, idx) => {
                const dueAmount = Math.max(
                  (loan.totalPayable || 0) -
                    ((loan.depositedPrincipal || 0) +
                      (loan.depositedInterest || 0)),
                  0
                );
                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      idx % 2 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-800 whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {loan.start}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">
                      {inr(loan.principal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {loan.rate}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums whitespace-nowrap">
                      {loan.months}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {loan.interestMethod}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 whitespace-nowrap">
                      {inr(loan.depositedPrincipal || 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 whitespace-nowrap">
                      {inr(loan.totalInterest || 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700 whitespace-nowrap">
                      {inr(loan.depositedInterest || 0)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${
                        dueAmount > 0 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {inr(dueAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {loan.status === "CLOSED" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Closed
                        </span>
                      ) : loan.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          Active
                        </span>
                      ) : loan.status === "CANCELED" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Canceled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={loan.status === "CLOSED"}
                        onClick={() => {
                          if (loan.status === "CLOSED") return;
                          setShowClearConfirm(loan.id);
                        }}
                        title={
                          loan.status === "CLOSED"
                            ? "Loan is closed"
                            : "Record a deposit / clear loan"
                        }
                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="inline w-4 h-4 mr-1.5 -mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Deposit
                      </button>
                      {showClearConfirm === loan.id && (
                        <div className="fixed inset-0 z-50">
                          <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() =>
                              !clearing && setShowClearConfirm(null)
                            }
                          />
                          <div className="absolute inset-0 grid place-items-center p-4">
                            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
                              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                                <h3 className="text-white font-bold">
                                  Clear this loan?
                                </h3>
                              </div>
                              <div className="p-6 space-y-3">
                                <p className="text-sm text-gray-700">
                                  Are you sure you want to mark this loan-{" "}
                                  {loan.principal}rs{" "}
                                  <span className="font-semibold">cleared</span>
                                  ?
                                </p>
                                <p className="text-xs text-gray-500">
                                  This action will call{" "}
                                  <code className="font-mono bg-gray-100 px-1 rounded">
                                    /api/loan/clearLoan
                                  </code>
                                  .
                                </p>
                                <div className="mt-4 flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                                    onClick={() => setShowClearConfirm(null)}
                                    disabled={clearing}
                                  >
                                    No
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmClear(loan.id)}
                                    disabled={clearing}
                                    className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold shadow hover:bg-red-700 disabled:opacity-70"
                                  >
                                    {clearing ? "Clearing..." : "Yes, clear"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setEditOpen(true);
                        }}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition-all duration-200"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No loans available
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table footer with totals */}
            <tfoot className="bg-gray-50 border-t">
              <tr className="font-semibold text-gray-800">
                <td className="px-4 py-3" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right">
                  {inr(tableTotals.principal)}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right text-emerald-700">
                  {inr(tableTotals.depoP)}
                </td>
                <td className="px-4 py-3"></td>

                <td className="px-4 py-3 text-right text-amber-700">
                  {inr(tableTotals.depoI)}
                </td>
                <td className="px-4 py-3 text-right text-rose-700">
                  {inr(tableTotals.due)}
                </td>
                <td className="px-4 py-3" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Manual Receipts */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            Payment Receipts (Manual)
          </h3>
          <span className="text-xs text-gray-500">
            Admins record payments; users don&apos;t submit directly
          </span>
        </div>

        <form
          onSubmit={addReceipt}
          className="p-4 border-b grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">Loan</label>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newLoanId}
              onChange={(e) => setNewLoanId(e.target.value)}
            >
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {"loan "} — {inr(l.principal)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              disabled
              readOnly
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-900 focus:outline-none cursor-not-allowed"
              value={todayISO}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Principal (₹)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newPrincipalPart}
              min={0}
              step="any"
              onChange={(e) => setNewPrincipalPart(Number(e.target.value))}
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Interest (₹)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newInterestPart}
              min={0}
              step="any"
              onChange={(e) => setNewInterestPart(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold">{inr(totalNewAmount)}</span>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow">
              Add Receipt
            </button>
            <span className="ml-2 text-xs text-gray-500">
              Static UI — saved in page state only
            </span>
          </div>
        </form>

        <div className="hidden md:block max-h-80 overflow-auto rounded-xl">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="sticky top-0 bg-white/90 backdrop-blur border-b">
              <tr className="text-left text-gray-600">
                <th className="px-3 py-3 font-semibold">Sr No</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Loan</th>
                <th className="px-3 py-3 font-semibold text-right">
                  Principal
                </th>
                <th className="px-3 py-3 font-semibold text-right">
                  Depo. Principal
                </th>
                <th className="px-3 py-3 font-semibold text-right">Interest</th>
                <th className="px-3 py-3 font-semibold text-right">Amount</th>
                <th className="px-3 py-3 font-semibold">Deposited At</th>

                <th className="px-3 py-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length ? (
                receipts.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={
                      idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                  >
                    <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                        Loan • {r.principal}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-medium">
                      {r.principal != null ? inr(r.principal) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-green-700 font-medium">
                      {r.depositPrincipal != null
                        ? inr(r.depositPrincipal)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber-700 font-medium">
                      {r.depositInterest != null ? inr(r.depositInterest) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-indigo-700">
                      {inr(r.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {r.depositedAt
                        ? new Date(r.depositedAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.note ? (
                        <span className="inline-block rounded bg-yellow-50 text-yellow-800 text-xs border border-yellow-100">
                          {r.note}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-gray-500"
                    colSpan={9}
                  >
                    No receipts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editOpen && selectedLoanId && (
        <EditLoan
          open={editOpen}
          loanId={selectedLoanId}
          onClose={() => setEditOpen(false)}
          onSubmit={() => {
            setEditOpen(false);
            loadReceipts(); // refresh data if needed
          }}
        />
      )}
    </section>
  );
}

// ---------- Small presentational helpers ----------
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function KPI({
  label,
  value,
  tone = "indigo",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "purple" | "teal" | "blue";
  icon?: React.ReactNode;
}) {
  const tones: Record<string, { ring: string; text: string; badge: string }> = {
    indigo: {
      ring: "ring-indigo-100",
      text: "text-indigo-700",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    emerald: {
      ring: "ring-emerald-100",
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    amber: {
      ring: "ring-amber-100",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-100",
    },
    rose: {
      ring: "ring-rose-100",
      text: "text-rose-700",
      badge: "bg-rose-50 text-rose-700 border-rose-100",
    },
    purple: {
      ring: "ring-purple-100",
      text: "text-purple-700",
      badge: "bg-purple-50 text-purple-700 border-purple-100",
    },
    teal: {
      ring: "ring-teal-100",
      text: "text-teal-700",
      badge: "bg-teal-50 text-teal-700 border-teal-100",
    },
    blue: {
      ring: "ring-blue-100",
      text: "text-blue-700",
      badge: "bg-blue-50 text-blue-700 border-blue-100",
    },
  };
  const t = tones[tone] ?? tones.indigo;
  return (
    <div
      className={`rounded-2xl p-5 shadow-md border bg-white ring-1 ${t.ring}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{label}</div>
        {icon && (
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${t.badge}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className={`mt-2 text-lg font-semibold ${t.text}`}>{value}</div>
    </div>
  );
}
