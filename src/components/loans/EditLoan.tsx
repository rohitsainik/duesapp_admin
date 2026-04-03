"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type PartyInfo = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type EditLoanFormProps = {
  open: boolean;
  loanId: string;
  onClose: () => void;
  onSubmit?: (updated: unknown) => void;
};

type LoanDetails = {
  id: string;
  borrowerId: string;
  adminId: string;
  principal: number;
  rate: number;
  months: number;
  startDate: string;
  endDate?: string | null;
  interestMethod: string;
  lockIn: boolean;
  minMonthsFloor: number;
  status: "ACTIVE" | "CLOSED" | "CANCELED";
  totalInterest?: number | null;
  totalPayable?: number | null;
  depositedPrincipal?: number | null;
  depositedInterest?: number | null;
  notes?: string | null;
  isSecured?: boolean;
};

export default function EditLoanForm({
  open,
  loanId,
  onClose,
  onSubmit,
}: EditLoanFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<LoanDetails | null>(null);

  // UI class helpers for consistent styling
  const inputCls =
    "w-full bg-white border border-gray-300 px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 transition-shadow duration-150";
  const disabledCls = "disabled:bg-gray-100 disabled:cursor-not-allowed";

  const [borrower, setBorrower] = useState<PartyInfo | null>(null);
  const [admin, setAdmin] = useState<PartyInfo | null>(null);
  const canEdit = data?.status !== "CLOSED" && data?.status !== "CANCELED";

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  // Fetch loan details
  useEffect(() => {
    if (!open || !loanId) return;
    const controller = new AbortController();
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        // Primary: POST to getLoanByLoanId with loanId in body
        let res = await fetch(`/api/loan/getLoanByLoanId`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loanId }),
          cache: "no-store",
          signal: controller.signal,
        });

        // Fallback to legacy endpoint if needed
        if (!res.ok) {
          res = await fetch(`/api/loan/getLoanById?loanId=${loanId}`, {
            cache: "no-store",
            signal: controller.signal,
          });
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to fetch loan ${loanId}`);
        }

        const payload = await res.json();
        const loan: LoanDetails = (payload?.loan ?? payload) as LoanDetails;
        const borrowerMeta = (payload?.loan?.borrower ??
          null) as PartyInfo | null;
        const adminMeta = (payload?.loan?.admin ?? null) as PartyInfo | null;
        if (!loan?.id) throw new Error("Invalid loan payload");
        if (!mounted) return;

        setData({
          id: loan.id,
          borrowerId: loan.borrowerId,
          adminId: loan.adminId,
          principal: Number(loan.principal ?? 0),
          rate: Number(loan.rate ?? 0),
          months: Number(loan.months ?? 0),
          startDate: (loan.startDate ?? "").slice(0, 10),
          endDate: loan.endDate ? loan.endDate.slice(0, 10) : null,
          interestMethod: loan.interestMethod,
          lockIn: Boolean(loan.lockIn),
          minMonthsFloor: Number(loan.minMonthsFloor ?? 0),
          status: loan.status,
          totalInterest:
            loan.totalInterest != null ? Number(loan.totalInterest) : null,
          totalPayable:
            loan.totalPayable != null ? Number(loan.totalPayable) : null,
          depositedPrincipal:
            loan.depositedPrincipal != null
              ? Number(loan.depositedPrincipal)
              : null,
          depositedInterest:
            loan.depositedInterest != null
              ? Number(loan.depositedInterest)
              : null,
          notes: loan.notes ?? "",
          isSecured: Boolean(loan.isSecured),
        });
        if (mounted) {
          setBorrower(borrowerMeta);
          setAdmin(adminMeta);
        }
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === "AbortError") return;
        console.error(e);
        const message = e instanceof Error ? e.message : "Failed to load loan";
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [open, loanId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    try {
      setSaving(true);
      const body = {
        loanId: data.id,
        principal: Number(data.principal),
        rate: Number(data.rate),
        months: Number(data.months),
        startDate: data.startDate,
        endDate: data.endDate || null,
        interestMethod: data.interestMethod,
        lockIn: Boolean(data.lockIn),
        minMonthsFloor: Number(data.minMonthsFloor),
        notes: (data.notes || "").trim() || null,
        isSecured: Boolean(data.isSecured),
      };

      const res = await fetch(`/api/loan/updateLoan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to update loan");

      toast.success("Loan updated successfully ✅");
      onSubmit?.(payload);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={() => !saving && onClose()}
      />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4 sm:p-6">
        <form
          onSubmit={handleSave}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-loan-title"
          className="w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Sticky header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h3
                  id="edit-loan-title"
                  className="text-white font-bold text-base sm:text-lg"
                >
                  Edit Loan
                </h3>
                <p className="text-white/80 text-[11px] sm:text-xs">
                  ID: {loanId} {data?.status ? `• Status: ${data.status}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ml-3 inline-flex items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 w-8 h-8"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293A1 1 0 014.293 14.293L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-7">
            {/* Parties */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Parties
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="text-xs text-gray-700">
                  <div className="font-semibold text-gray-600 mb-1">
                    Borrower
                  </div>
                  {borrower ? (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        {borrower.name || "—"}
                      </span>
                      {borrower.email && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                          {borrower.email}
                        </span>
                      )}
                      {borrower.phone && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                          {borrower.phone}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">No borrower info</div>
                  )}
                </div>
                <div className="text-xs text-gray-700">
                  <div className="font-semibold text-gray-600 mb-1">Admin</div>
                  {admin ? (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        {admin.name || "—"}
                      </span>
                      {admin.email && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                          {admin.email}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">No admin info</div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Computed &amp; Deposits
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border p-3.5 bg-gray-50">
                  <div className="text-gray-500">Total Interest</div>
                  <div className="font-semibold text-indigo-700">
                    {data?.totalInterest != null
                      ? Number(data.totalInterest).toFixed(2)
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border p-3.5 bg-gray-50">
                  <div className="text-gray-500">Total Payable</div>
                  <div className="font-semibold text-purple-700">
                    {data?.totalPayable != null
                      ? Number(data.totalPayable).toFixed(2)
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border p-3.5 bg-gray-50">
                  <div className="text-gray-500">Deposited Principal</div>
                  <div className="font-semibold text-emerald-700">
                    {data?.depositedPrincipal != null
                      ? Number(data.depositedPrincipal).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
                <div className="rounded-xl border p-3.5 bg-gray-50">
                  <div className="text-gray-500">Deposited Interest</div>
                  <div className="font-semibold text-amber-700">
                    {data?.depositedInterest != null
                      ? Number(data.depositedInterest).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms &amp; Policy */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Terms &amp; Policy
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal (₹)
                  </label>
                  <input
                    type="number"
                    value={data?.principal ?? ""}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, principal: Number(e.target.value) } : d
                      )
                    }
                    disabled={!canEdit}
                    min={0}
                    className={`${inputCls} ${disabledCls}`}
                    autoFocus
                  />
                </div>
                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (% per month)
                  </label>
                  <input
                    type="number"
                    value={data?.rate ?? ""}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, rate: Number(e.target.value) } : d
                      )
                    }
                    step="0.01"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    className={`${inputCls} ${disabledCls}`}
                  />
                </div>
                {/* Months */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Months (term)
                  </label>
                  <input
                    type="number"
                    value={data?.months ?? ""}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, months: Number(e.target.value) } : d
                      )
                    }
                    min={1}
                    disabled={!canEdit}
                    className={`${inputCls} ${disabledCls}`}
                  />
                </div>
                {/* Start date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={data?.startDate ?? ""}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, startDate: e.target.value } : d
                      )
                    }
                    disabled={!canEdit}
                    className={`${inputCls} ${disabledCls}`}
                  />
                </div>
                {/* End date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={data?.endDate ?? ""}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, endDate: e.target.value } : d
                      )
                    }
                    disabled={!canEdit}
                    className={`${inputCls} ${disabledCls}`}
                  />
                </div>
                {/* Interest method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Method
                  </label>
                  <select
                    value={data?.interestMethod ?? "SIMPLE"}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, interestMethod: e.target.value } : d
                      )
                    }
                    disabled={!canEdit}
                    className={`${inputCls} ${disabledCls} text-sm`}
                  >
                    <option value="SIMPLE">SIMPLE</option>
                    <option value="REDUCING">REDUCING</option>
                    <option value="COMPOUND">COMPOUND</option>
                    <option value="MONTHLY_FLAT">MONTHLY_FLAT</option>
                  </select>
                </div>
                {/* Is Secured */}
                <div className="flex items-center gap-2">
                  <input
                    id="isSecured"
                    type="checkbox"
                    checked={Boolean(data?.isSecured)}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, isSecured: e.target.checked } : d
                      )
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 transition-shadow"
                  />
                  <label htmlFor="isSecured" className="text-sm text-gray-700">
                    Secured Loan
                  </label>
                </div>
                {/* Status (read-only view) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <input
                    type="text"
                    value={data?.status ?? ""}
                    readOnly
                    className={`${inputCls} bg-gray-100 text-gray-700`}
                  />
                </div>
                {/* Lock-in */}
                <div className="flex items-center gap-2">
                  <input
                    id="lockIn"
                    type="checkbox"
                    checked={Boolean(data?.lockIn)}
                    onChange={(e) =>
                      setData((d) =>
                        d ? { ...d, lockIn: e.target.checked } : d
                      )
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 transition-shadow"
                  />
                  <label htmlFor="lockIn" className="text-sm text-gray-700">
                    Lock-in (charge full-term interest on early closure)
                  </label>
                </div>
                {/* Min months floor */}
                {!data?.lockIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Months Floor
                    </label>
                    <input
                      type="number"
                      value={data?.minMonthsFloor ?? 0}
                      onChange={(e) =>
                        setData((d) =>
                          d
                            ? { ...d, minMonthsFloor: Number(e.target.value) }
                            : d
                        )
                      }
                      min={0}
                      max={data?.months ?? 120}
                      disabled={!canEdit}
                      className={`${inputCls} ${disabledCls}`}
                    />
                  </div>
                )}
                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={data?.notes ?? ""}
                    onChange={(e) =>
                      setData((d) => (d ? { ...d, notes: e.target.value } : d))
                    }
                    disabled={!canEdit}
                    rows={3}
                    className={`${inputCls} ${disabledCls}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canEdit || saving}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Loan"}
            </button>
          </div>
        </form>
      </div>

      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="px-4 py-2 rounded bg-white shadow border text-sm text-gray-600">
            Loading loan…
          </div>
        </div>
      )}
    </div>
  );
}
