"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/loader";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "USER";
  _count?: { loansBorrowed?: number };
};

type ApiUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  admin?: { name?: string | null } | null;
  loansBorrowed?: unknown[] | null;
  _count?: { loansBorrowed?: number };
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

// ── Icons ─────────────────────────────────────────────────────────────────────
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

const ActiveIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);

const InactiveIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshIcon = ({ spin }: { spin?: boolean }) => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={spin ? "animate-spin" : ""}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Avatar palette (deterministic by name) ────────────────────────────────────
const avatarColors = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
];
const avatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    password: string;
  }) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password] = useState("123456");

  function reset() {
    setUserId("");
    setName("");
    setEmail("");
    setPhone("");
    setLocation("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({ userId, name, email, phone, location, password });
    reset();
  }

  if (!open) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-medium text-slate-500 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add new user</h3>
            <p className="text-xs text-slate-400 mt-0.5">Default password: <span className="font-mono font-medium text-slate-600">123456</span></p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                User ID <span className="text-red-400">*</span>
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="USR001"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Udaipur, Rajasthan"
                className={inputClass}
              />
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
            <span className="text-indigo-500 flex-shrink-0 mt-0.5">
              <InfoIcon />
            </span>
            <p className="text-xs text-indigo-600 leading-relaxed">
              User will be able to change their password after first login.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <PlusIcon />
                  Create user
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function UsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getUsers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(
        data.users.map((u: ApiUser) => ({
          ...u,
          role: "USER" as const,
          loans: u.loansBorrowed?.length ?? 0,
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalLoans = useMemo(
    () => users.reduce((s, u) => s + (u._count?.loansBorrowed ?? 0), 0),
    [users]
  );
  const withLoans = useMemo(
    () => users.filter((u) => (u._count?.loansBorrowed ?? 0) > 0).length,
    [users]
  );
  const noLoans = users.length - withLoans;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s)
    );
  }, [q, users]);

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate(data: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    password: string;
  }) {
    if (!data.userId.trim()) { toast.error("User ID is required"); return; }
    if (!data.name.trim()) { toast.error("Name is required"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      toast.error("Valid email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      toast.success("User created successfully!");
      setModalOpen(false);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function removeUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user"
      );
    }
  }

  // ── KPI cards config ───────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total Users",
      value: users.length,
      sub: "Registered borrowers",
      icon: <UsersIcon />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      badge: "Live",
      badgeBg: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Loans",
      value: totalLoans,
      sub: "Across all users",
      icon: <LoansIcon />,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      badge: "All",
      badgeBg: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Active Borrowers",
      value: withLoans,
      sub: "Users with loans",
      icon: <ActiveIcon />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      badge: "Active",
      badgeBg: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "No Loans Yet",
      value: noLoans,
      sub: "Inactive users",
      icon: <InactiveIcon />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      badge: "Pending",
      badgeBg: "bg-amber-50 text-amber-700",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <CreateUserModal
        open={modalOpen}
        loading={loading}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <div className="space-y-6">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage all borrowers registered under your account.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon />
            Add user
          </button>
        </div>

        {/* ── Hero banner ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-indigo-600 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-r border-indigo-500 pr-4">
              <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Total users</div>
              <div className="text-white text-2xl font-bold">{users.length}</div>
              <div className="text-indigo-300 text-xs mt-1">Registered</div>
            </div>
            <div className="border-r border-indigo-500 pr-4 pl-2">
              <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Total loans</div>
              <div className="text-white text-2xl font-bold">{totalLoans}</div>
              <div className="text-indigo-300 text-xs mt-1">Across all users</div>
            </div>
            <div className="border-r border-indigo-500 pr-4 pl-2">
              <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Active borrowers</div>
              <div className="text-white text-2xl font-bold">{withLoans}</div>
              <div className="text-emerald-300 text-xs mt-1">With active loans</div>
            </div>
            <div className="pl-2">
              <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">No loans yet</div>
              <div className="text-white text-2xl font-bold">{noLoans}</div>
              <div className="text-indigo-300 text-xs mt-1">Inactive users</div>
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
              <div className="text-2xl font-bold text-slate-900 mb-3 tabular-nums">{kpi.value}</div>
              <div className="text-xs text-slate-400">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Users table card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">

          {/* Table toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-900">All users</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filtered.length} of {users.length} users
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshIcon spin={loading} />
              Refresh
            </button>
          </div>

          {/* ── Mobile cards ── */}
          {loading ? (
            <div className="py-16 flex items-center justify-center sm:hidden">
              <Loader />
            </div>
          ) : (
            <div className="sm:hidden p-4 space-y-3">
              {filtered.length === 0 ? (
                <EmptyState hasQuery={!!q} />
              ) : (
                filtered.map((u) => {
                  const av = avatarColor(u.name);
                  return (
                    <div
                      key={u.id}
                      className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full ${av.bg} ${av.text} flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-400">ID: {u.userId}</p>
                          </div>
                        </div>
                        <LoansBadge count={u._count?.loansBorrowed ?? 0} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <InfoCell label="Email" value={u.email} truncate />
                        <InfoCell label="Phone" value={u.phone} />
                        <div className="col-span-2">
                          <InfoCell label="Location" value={u.location} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => removeUser(u.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                        >
                          <TrashIcon /> Delete
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                          <EditIcon /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16">
                <EmptyState hasQuery={!!q} />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["User", "Email", "Phone", "Location", "Loans", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-medium text-slate-400 px-6 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((u) => {
                    const av = avatarColor(u.name);
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${av.bg} ${av.text} text-xs font-semibold flex-shrink-0`}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 text-sm">{u.name}</div>
                              <div className="text-xs text-slate-400">ID: {u.userId}</div>
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-6 py-4 text-slate-600 text-sm max-w-[180px] truncate">
                          {u.email}
                        </td>
                        {/* Phone */}
                        <td className="px-6 py-4 text-sm">
                          {u.phone ? (
                            <span className="text-slate-600">{u.phone}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        {/* Location */}
                        <td className="px-6 py-4 text-sm">
                          {u.location ? (
                            <span className="text-slate-600">{u.location}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        {/* Loans */}
                        <td className="px-6 py-4">
                          <LoansBadge count={u._count?.loansBorrowed ?? 0} />
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => removeUser(u.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                            >
                              <TrashIcon /> Delete
                            </button>
                            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors">
                              <EditIcon /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing{" "}
                <strong className="text-slate-600">{filtered.length}</strong> of{" "}
                <strong className="text-slate-600">{users.length}</strong> users
              </span>
              <span className="hidden md:block">Column sorting coming soon</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function LoansBadge({ count }: { count: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        count > 0
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      {count > 0 && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      )}
      {count} {count === 1 ? "loan" : "loans"}
    </span>
  );
}

function InfoCell({
  label,
  value,
  truncate,
}: {
  label: string;
  value?: string | null;
  truncate?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className={`text-slate-700 text-xs ${truncate ? "truncate" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
        <UsersIcon />
      </div>
      <p className="text-sm font-medium text-slate-500">No users found</p>
      <p className="text-xs text-slate-400 mt-1">
        {hasQuery ? "Try a different search term" : "Click Add user to get started"}
      </p>
    </div>
  );
}