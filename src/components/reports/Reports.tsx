"use client";

import React, { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "all" | "oct" | "nov" | "dec";

// ── Static data ───────────────────────────────────────────────────────────────
const LOANS = [
  { id: "L1", user: "User X", userId: "USR001", principal: 50000,  rate: 4, months: 12, disbursed: "2024-10-01", status: "Active",  paid: 16500, remaining: 33500 },
  { id: "L2", user: "User Y", userId: "USR002", principal: 100000, rate: 5, months: 12, disbursed: "2024-10-15", status: "Active",  paid: 26200, remaining: 73800 },
  { id: "L3", user: "User Z", userId: "USR003", principal: 80000,  rate: 4, months: 12, disbursed: "2024-10-10", status: "Active",  paid: 19800, remaining: 60200 },
];

const MONTHLY = [
  { month: "Oct '24", disbursed: 230000, collected: 20000, interest: 4100 },
  { month: "Nov '24", disbursed: 0,      collected: 22500, interest: 4200 },
  { month: "Dec '24", disbursed: 0,      collected: 24500, interest: 4150 },
];

const SUMMARY = {
  portfolio:       230000,
  totalInterest:   12450,
  totalCollected:  62500,
  outstanding:     167500,
  avgRate:         4.33,
  repaymentRate:   98.5,
  activeLoans:     3,
  users:           3,
};

const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const pct = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

// ── Icons ─────────────────────────────────────────────────────────────────────
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
const CollectedIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const OutstandingIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ── Mini bar chart (pure CSS/SVG, no lib) ─────────────────────────────────────
function BarChart({
  data,
  valueKey,
  color,
}: {
  data: typeof MONTHLY;
  valueKey: keyof (typeof MONTHLY)[0];
  color: string;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 1);
  const barW = 32;
  const gap = 20;
  const chartH = 80;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + 24}`} width="100%" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const h = Math.max(4, (val / max) * chartH);
        const x = i * (barW + gap);
        const y = chartH - h;
        return (
          <g key={i}>
            {/* track */}
            <rect x={x} y={0} width={barW} height={chartH} rx={4} fill="#F1F5F9" />
            {/* bar */}
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={color} opacity={0.85} />
            {/* label */}
            <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={9} fill="#94A3B8">
              {d.month.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut (SVG) ───────────────────────────────────────────────────────────────
function Donut({ collected, outstanding }: { collected: number; outstanding: number }) {
  const total = collected + outstanding;
  const r = 36;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;
  const cPct = pct(collected, total);
  const cLen = (cPct / 100) * circ;

  return (
    <svg viewBox="0 0 100 100" width="100" height="100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEF2FF" strokeWidth={14} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#4F46E5"
        strokeWidth={14}
        strokeDasharray={`${cLen} ${circ - cLen}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1E293B">{cPct}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#94A3B8">collected</text>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ReportsClient() {
  const [period, setPeriod] = useState<Period>("all");

  const periodLabel: Record<Period, string> = {
    all: "All time",
    oct: "October 2024",
    nov: "November 2024",
    dec: "December 2024",
  };

  const kpis = [
    {
      label: "Portfolio value",
      value: inr(SUMMARY.portfolio),
      sub: "Total disbursed",
      icon: <PortfolioIcon />,
      iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
      badge: "Total", badgeBg: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Total interest",
      value: inr(SUMMARY.totalInterest),
      sub: `${SUMMARY.avgRate}% avg rate`,
      icon: <InterestIcon />,
      iconBg: "bg-amber-50", iconColor: "text-amber-600",
      badge: "Expected", badgeBg: "bg-amber-50 text-amber-700",
    },
    {
      label: "Amount collected",
      value: inr(SUMMARY.totalCollected),
      sub: `${pct(SUMMARY.totalCollected, SUMMARY.portfolio)}% of portfolio`,
      icon: <CollectedIcon />,
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      badge: "Received", badgeBg: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Outstanding",
      value: inr(SUMMARY.outstanding),
      sub: `${pct(SUMMARY.outstanding, SUMMARY.portfolio)}% remaining`,
      icon: <OutstandingIcon />,
      iconBg: "bg-rose-50", iconColor: "text-rose-600",
      badge: "Pending", badgeBg: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Portfolio overview and loan-level breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(["all", "oct", "nov", "dec"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors">
            <DownloadIcon />
            Export
          </button>
        </div>
      </div>

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-indigo-600 p-6">
        <div className="flex items-start justify-between mb-1">
          <span className="text-indigo-200 text-xs font-medium uppercase tracking-wide">
            {periodLabel[period]}
          </span>
          <span className="text-xs bg-white/15 text-indigo-100 px-2.5 py-1 rounded-full">
            {SUMMARY.activeLoans} active loans · {SUMMARY.users} borrowers
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="border-r border-indigo-500 pr-4">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Portfolio</div>
            <div className="text-white text-2xl font-bold">{inr(SUMMARY.portfolio)}</div>
            <div className="text-indigo-300 text-xs mt-1"><span className="text-emerald-300">↑ 12.5%</span> growth</div>
          </div>
          <div className="border-r border-indigo-500 pr-4 pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Collected</div>
            <div className="text-white text-2xl font-bold">{inr(SUMMARY.totalCollected)}</div>
            <div className="text-indigo-300 text-xs mt-1">{pct(SUMMARY.totalCollected, SUMMARY.portfolio)}% of total</div>
          </div>
          <div className="border-r border-indigo-500 pr-4 pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Repayment</div>
            <div className="text-white text-2xl font-bold">{SUMMARY.repaymentRate}%</div>
            <div className="text-emerald-300 text-xs mt-1">Excellent health</div>
          </div>
          <div className="pl-2">
            <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Interest</div>
            <div className="text-white text-2xl font-bold">{inr(SUMMARY.totalInterest)}</div>
            <div className="text-indigo-300 text-xs mt-1">{SUMMARY.avgRate}% avg rate</div>
          </div>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                {kpi.icon}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.badgeBg}`}>
                {kpi.badge}
              </span>
            </div>
            <div className="text-slate-500 text-xs font-medium mb-1">{kpi.label}</div>
            <div className="text-xl font-bold text-slate-900 mb-3 tabular-nums">{kpi.value}</div>
            <div className="text-xs text-slate-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts + Collection row ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Monthly disbursement chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Monthly disbursement</h2>
              <p className="text-xs text-slate-400 mt-0.5">Principal released per month</p>
            </div>
          </div>
          <BarChart data={MONTHLY} valueKey="disbursed" color="#4F46E5" />
        </div>

        {/* Monthly collections chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Monthly collections</h2>
              <p className="text-xs text-slate-400 mt-0.5">Amount received per month</p>
            </div>
          </div>
          <BarChart data={MONTHLY} valueKey="collected" color="#10B981" />
        </div>

        {/* Collection progress donut */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Collection progress</h2>
            <p className="text-xs text-slate-400 mt-0.5">Collected vs outstanding</p>
          </div>
          <div className="flex items-center gap-5">
            <Donut collected={SUMMARY.totalCollected} outstanding={SUMMARY.outstanding} />
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                  <span className="text-xs text-slate-500">Collected</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">{inr(SUMMARY.totalCollected)}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-100 flex-shrink-0" />
                  <span className="text-xs text-slate-500">Outstanding</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">{inr(SUMMARY.outstanding)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${pct(SUMMARY.totalCollected, SUMMARY.portfolio)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-slate-400">0%</span>
              <span className="text-xs text-indigo-600 font-medium">
                {pct(SUMMARY.totalCollected, SUMMARY.portfolio)}% collected
              </span>
              <span className="text-xs text-slate-400">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly breakdown table ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Monthly breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Disbursement, collections &amp; interest by month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Month", "Disbursed", "Collected", "Interest", "Collection rate"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-400 px-6 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MONTHLY.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 text-sm">{row.month}</td>
                  <td className="px-6 py-4 tabular-nums text-slate-700 text-sm">
                    {row.disbursed > 0 ? inr(row.disbursed) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-slate-700 text-sm">{inr(row.collected)}</td>
                  <td className="px-6 py-4 tabular-nums text-amber-600 text-sm">{inr(row.interest)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, pct(row.collected, row.collected + 10000))}%` }}
                        />
                      </div>
                      <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                        {SUMMARY.repaymentRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</td>
                <td className="px-6 py-3.5 tabular-nums text-sm font-semibold text-slate-900">
                  {inr(MONTHLY.reduce((s, r) => s + r.disbursed, 0))}
                </td>
                <td className="px-6 py-3.5 tabular-nums text-sm font-semibold text-slate-900">
                  {inr(MONTHLY.reduce((s, r) => s + r.collected, 0))}
                </td>
                <td className="px-6 py-3.5 tabular-nums text-sm font-semibold text-amber-600">
                  {inr(MONTHLY.reduce((s, r) => s + r.interest, 0))}
                </td>
                <td className="px-6 py-3.5" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Loan-level breakdown ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Loan-level breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Repayment progress per loan</p>
          </div>
          <span className="text-xs text-slate-400">{LOANS.length} loans</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Borrower", "Principal", "Rate", "Paid", "Remaining", "Progress", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-400 px-6 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {LOANS.map((loan) => {
                const progress = pct(loan.paid, loan.principal);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Borrower */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex-shrink-0">
                          {loan.user.replace("User ", "")}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{loan.user}</div>
                          <div className="text-xs text-slate-400">{loan.id} · {loan.userId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Principal */}
                    <td className="px-6 py-4 tabular-nums font-semibold text-slate-900 text-sm">
                      {inr(loan.principal)}
                    </td>
                    {/* Rate */}
                    <td className="px-6 py-4 text-slate-600 text-sm">{loan.rate}%</td>
                    {/* Paid */}
                    <td className="px-6 py-4 tabular-nums text-emerald-600 text-sm font-medium">
                      {inr(loan.paid)}
                    </td>
                    {/* Remaining */}
                    <td className="px-6 py-4 tabular-nums text-rose-500 text-sm">
                      {inr(loan.remaining)}
                    </td>
                    {/* Progress */}
                    <td className="px-6 py-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>
            Total repaid:{" "}
            <strong className="text-slate-600">{inr(LOANS.reduce((s, l) => s + l.paid, 0))}</strong>
            {" "}of{" "}
            <strong className="text-slate-600">{inr(LOANS.reduce((s, l) => s + l.principal, 0))}</strong>
          </span>
          <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            View all loans <ArrowRightIcon />
          </button>
        </div>
      </div>

      {/* ── Per-user summary ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {LOANS.map((loan) => {
          const progress = pct(loan.paid, loan.principal);
          const interest = Math.round((loan.principal * loan.rate * loan.months) / (100 * 12));
          return (
            <div
              key={loan.id}
              className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex-shrink-0">
                    {loan.user.replace("User ", "")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{loan.user}</div>
                    <div className="text-xs text-slate-400">{loan.id} · {loan.rate}% p.a.</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "Principal",  value: inr(loan.principal), color: "text-slate-900" },
                  { label: "Interest",   value: inr(interest),       color: "text-amber-600" },
                  { label: "Paid",       value: inr(loan.paid),      color: "text-emerald-600" },
                  { label: "Remaining",  value: inr(loan.remaining), color: "text-rose-500" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                    <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                    <div className={`text-sm font-semibold tabular-nums ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Repayment progress</span>
                  <span className="text-xs font-medium text-indigo-600">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}