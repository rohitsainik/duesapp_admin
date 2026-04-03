import React from "react";
import { LoansClient } from "@/components/loans/LoansClient";

export const metadata = {
  title: "Loans",
};

export default function LoansPage() {
  // TODO: replace with real computed stats from backend or context
  const stats = {
    totalLoans: 3,
    totalPrincipal: 230000,
    totalInterest: 13000,
    totalReceived: 50000,
  };

  const currency = (n: number) =>
    n.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6">
      {/* Dashboard Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4 shadow-sm bg-white">
          <div className="text-xs text-gray-500">Total Loans</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.totalLoans}
          </div>
        </div>
        <div className="rounded-xl border p-4 shadow-sm bg-white">
          <div className="text-xs text-gray-500">Total Principal</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {currency(stats.totalPrincipal)}
          </div>
        </div>
        <div className="rounded-xl border p-4 shadow-sm bg-white">
          <div className="text-xs text-gray-500">Total Interest (est.)</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {currency(stats.totalInterest)}
          </div>
        </div>
        <div className="rounded-xl border p-4 shadow-sm bg-white">
          <div className="text-xs text-gray-500">Total Received</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">
            {currency(stats.totalReceived)}
          </div>
        </div>
      </div>

      {/* Loan List + Create Form */}
      <LoansClient />
    </div>
  );
}
