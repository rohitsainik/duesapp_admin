"use client";

import React from "react";
import Link from "next/link";

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

export function DashboardClient() {
  const summary = {
    totalAdmins: 1,
    totalUsers: 3,
    activeLoans: 3,
    portfolio: 230000,
    totalInterest: 12450,
    avgLoanSize: 76666,
    repaymentRate: 98.5,
  };

  const recentLoans = [
    {
      id: "L2",
      user: "User Y",
      admin: "Admin A",
      principal: 100000,
      rate: 5,
      months: 12,
      status: "Active",
      disbursedDate: "2024-10-15",
    },
    {
      id: "L3",
      user: "User Z",
      admin: "Admin A",
      principal: 80000,
      rate: 4,
      months: 12,
      status: "Active",
      disbursedDate: "2024-10-10",
    },
    {
      id: "L1",
      user: "User X",
      admin: "Admin A",
      principal: 50000,
      rate: 4,
      months: 12,
      status: "Active",
      disbursedDate: "2024-10-01",
    },
  ];

  const recentActivity = [
    {
      action: "Loan L2 disbursed to User Y",
      time: "2 hours ago",
      type: "loan",
    },
    { action: "User Z account created", time: "1 day ago", type: "user" },
    { action: "Payment received for L1", time: "2 days ago", type: "payment" },
    { action: "Loan L3 approved", time: "3 days ago", type: "approval" },
  ];

  const portfolioBreakdown = [
    {
      label: "Outstanding",
      value: 230000,
      color: "bg-blue-500",
      percentage: 100,
    },
    { label: "Overdue", value: 0, color: "bg-red-500", percentage: 0 },
    { label: "Paid", value: 45000, color: "bg-emerald-500", percentage: 19.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 shadow-2xl">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-lg shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Loan Management Dashboard
                </h1>
                <p className="text-indigo-100 text-sm mt-1">
                  Real-time overview of your loan portfolio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">
                  Portfolio Value
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {inr(summary.portfolio)}
                </div>
                <div className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
                  <span>↑</span> 12.5% growth
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">
                  Active Loans
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {summary.activeLoans}
                </div>
                <div className="text-white/70 text-xs mt-1">
                  Across {summary.totalUsers} users
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">
                  Avg Loan Size
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {inr(summary.avgLoanSize)}
                </div>
                <div className="text-white/70 text-xs mt-1">Per borrower</div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/20">
                <div className="text-indigo-100 text-sm font-medium">
                  Repayment Rate
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {summary.repaymentRate}%
                </div>
                <div className="text-emerald-300 text-xs mt-1">Excellent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Live
                </span>
              </div>
              <div className="text-slate-600 text-sm font-medium mb-1">
                Total Users
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {summary.totalUsers}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {summary.totalAdmins} Admin
                </span>
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-slate-600 text-sm font-medium mb-1">
                Active Loans
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {summary.activeLoans}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">All current</span>
                <Link
                  href="/admin/loans"
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  Manage →
                </Link>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-50 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <svg
                    className="w-6 h-6"
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
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  Total
                </span>
              </div>
              <div className="text-slate-600 text-sm font-medium mb-1">
                Portfolio Value
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {inr(summary.portfolio)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Outstanding</span>
                <Link
                  href="/admin/account"
                  className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
                >
                  Reports →
                </Link>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  Interest
                </span>
              </div>
              <div className="text-slate-600 text-sm font-medium mb-1">
                Total Interest
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-3">
                {inr(summary.totalInterest)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Expected</span>
                <span className="text-amber-600 font-medium">4.33% avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Loans - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-2xl bg-white shadow-lg border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent Loans
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Latest disbursed loans
                </p>
              </div>
              <Link
                href="/admin/loans"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {recentLoans.map((loan, idx) => (
                  <div
                    key={loan.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-slate-50/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-semibold text-sm">
                          {loan.user.split(" ")[1]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {loan.user}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID: {loan.id}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        {loan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Principal
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {inr(loan.principal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Interest Rate
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {loan.rate}% p.a.
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Duration
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {loan.months} months
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">
                          Disbursed
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {new Date(loan.disbursedDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/admin/loans"
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/50 p-4 hover:shadow-md transition-all duration-200 group border border-indigo-200/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white group-hover:scale-110 transition-transform">
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
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      Create Loan
                    </div>
                    <div className="text-xs text-slate-600">
                      Disburse new loan
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 hover:shadow-md transition-all duration-200 group border border-emerald-200/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white group-hover:scale-110 transition-transform">
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
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">Add User</div>
                    <div className="text-xs text-slate-600">
                      Create new borrower
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/account"
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 hover:shadow-md transition-all duration-200 group border border-purple-200/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white group-hover:scale-110 transition-transform">
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
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      View Reports
                    </div>
                    <div className="text-xs text-slate-600">
                      Analytics & insights
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                        activity.type === "loan"
                          ? "bg-blue-100 text-blue-600"
                          : activity.type === "user"
                          ? "bg-emerald-100 text-emerald-600"
                          : activity.type === "payment"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {activity.type === "loan" && (
                        <span className="text-xs">💳</span>
                      )}
                      {activity.type === "user" && (
                        <span className="text-xs">👤</span>
                      )}
                      {activity.type === "payment" && (
                        <span className="text-xs">💰</span>
                      )}
                      {activity.type === "approval" && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-900">
                        {activity.action}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Portfolio Breakdown
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Current loan status distribution
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {portfolioBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-600">
                    {item.label}
                  </div>
                  <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-2">
                  {inr(item.value)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
