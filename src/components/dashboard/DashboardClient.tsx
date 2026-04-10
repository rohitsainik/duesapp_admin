"use client";

import React from "react";
import Link from "next/link";

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const UsersIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const LoansIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PortfolioIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InterestIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const AddUserIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const ReportIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

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
    { id: "L2", user: "User Y", admin: "Admin A", principal: 100000, rate: 5, months: 12, status: "Active", disbursedDate: "2024-10-15" },
    { id: "L3", user: "User Z", admin: "Admin A", principal: 80000, rate: 4, months: 12, status: "Active", disbursedDate: "2024-10-10" },
    { id: "L1", user: "User X", admin: "Admin A", principal: 50000, rate: 4, months: 12, status: "Active", disbursedDate: "2024-10-01" },
  ];

  const recentActivity = [
    { action: "Loan L2 disbursed to User Y", time: "2 hours ago", type: "loan" },
    { action: "User Z account created", time: "1 day ago", type: "user" },
    { action: "Payment received for L1", time: "2 days ago", type: "payment" },
    { action: "Loan L3 approved", time: "3 days ago", type: "approval" },
  ];

  const activityDot: Record<string, string> = {
    loan: "bg-indigo-500",
    user: "bg-emerald-500",
    payment: "bg-amber-500",
    approval: "bg-blue-500",
  };

  const kpis = [
    {
      label: "Total Users",
      value: summary.totalUsers,
      sub: `${summary.totalAdmins} admin`,
      icon: <UsersIcon />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      badge: "Live",
      badgeBg: "bg-blue-50 text-blue-700",
      link: "/admin/users",
      linkLabel: "View all",
    },
    {
      label: "Active Loans",
      value: summary.activeLoans,
      sub: "All current",
      icon: <LoansIcon />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      badge: "Active",
      badgeBg: "bg-emerald-50 text-emerald-700",
      link: "/admin/loans",
      linkLabel: "Manage",
    },
    {
      label: "Portfolio Value",
      value: inr(summary.portfolio),
      sub: "Outstanding",
      icon: <PortfolioIcon />,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      badge: "Total",
      badgeBg: "bg-indigo-50 text-indigo-700",
      link: "/admin/account",
      linkLabel: "Reports",
    },
    {
      label: "Total Interest",
      value: inr(summary.totalInterest),
      sub: "4.33% avg rate",
      icon: <InterestIcon />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      badge: "Expected",
      badgeBg: "bg-amber-50 text-amber-700",
      link: null,
      linkLabel: null,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back — here's what's happening today.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Hero stats banner */}
      <div className="rounded-2xl bg-indigo-600 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border-r border-indigo-500 pr-4">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Portfolio</div>
            <div className="text-white text-2xl font-bold">{inr(summary.portfolio)}</div>
            <div className="text-indigo-300 text-xs mt-1 flex items-center gap-1">
              <span className="text-emerald-300">↑ 12.5%</span> growth
            </div>
          </div>
          <div className="border-r border-indigo-500 pr-4 pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Avg Loan</div>
            <div className="text-white text-2xl font-bold">{inr(summary.avgLoanSize)}</div>
            <div className="text-indigo-300 text-xs mt-1">Per borrower</div>
          </div>
          <div className="border-r border-indigo-500 pr-4 pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Repayment</div>
            <div className="text-white text-2xl font-bold">{summary.repaymentRate}%</div>
            <div className="text-emerald-300 text-xs mt-1">Excellent health</div>
          </div>
          <div className="pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Interest</div>
            <div className="text-white text-2xl font-bold">{inr(summary.totalInterest)}</div>
            <div className="text-indigo-300 text-xs mt-1">Total expected</div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                {kpi.icon}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.badgeBg}`}>
                {kpi.badge}
              </span>
            </div>
            <div className="text-slate-500 text-xs font-medium mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold text-slate-900 mb-3 tabular-nums">{kpi.value}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{kpi.sub}</span>
              {kpi.link && (
                <Link href={kpi.link} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  {kpi.linkLabel} <ArrowRightIcon />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent loans table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent loans</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest disbursements</p>
            </div>
            <Link href="/admin/loans" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ArrowRightIcon />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Borrower</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">Principal</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">Rate</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">Term</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">Disbursed</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex-shrink-0">
                          {loan.user.replace("User ", "")}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{loan.user}</div>
                          <div className="text-xs text-slate-400">{loan.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums text-sm">
                      {inr(loan.principal)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-600 text-sm">
                      {loan.rate}%
                    </td>
                    <td className="px-4 py-4 text-right text-slate-600 text-sm">
                      {loan.months}mo
                    </td>
                    <td className="px-4 py-4 text-right text-slate-400 text-xs">
                      {new Date(loan.disbursedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick actions</h2>
            <div className="space-y-2">
              <Link href="/admin/loans" className="flex items-center gap-3 rounded-lg p-3 hover:bg-indigo-50 transition-colors group border border-transparent hover:border-indigo-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white flex-shrink-0 group-hover:bg-indigo-700 transition-colors">
                  <PlusIcon />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">Create loan</div>
                  <div className="text-xs text-slate-400">Disburse a new loan</div>
                </div>
                <ArrowRightIcon />
              </Link>
              <Link href="/admin/users" className="flex items-center gap-3 rounded-lg p-3 hover:bg-emerald-50 transition-colors group border border-transparent hover:border-emerald-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white flex-shrink-0 group-hover:bg-emerald-700 transition-colors">
                  <AddUserIcon />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">Add borrower</div>
                  <div className="text-xs text-slate-400">Create new user account</div>
                </div>
                <ArrowRightIcon />
              </Link>
              <Link href="/admin/account" className="flex items-center gap-3 rounded-lg p-3 hover:bg-purple-50 transition-colors group border border-transparent hover:border-purple-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white flex-shrink-0 group-hover:bg-purple-700 transition-colors">
                  <ReportIcon />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-purple-700">View reports</div>
                  <div className="text-xs text-slate-400">Analytics & insights</div>
                </div>
                <ArrowRightIcon />
              </Link>
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${activityDot[item.type]}`} />
                    {i < recentActivity.length - 1 && (
                      <div className="w-px flex-1 bg-slate-100 mt-1" style={{ minHeight: "20px" }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm text-slate-700 leading-tight">{item.action}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio health */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Portfolio health</h2>
            <p className="text-xs text-slate-400 mb-4">Repayment rate</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">{summary.repaymentRate}%</span>
              <span className="text-xs text-emerald-600 font-medium mb-1">Excellent</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${summary.repaymentRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">0%</span>
              <span className="text-xs text-slate-400">100%</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}