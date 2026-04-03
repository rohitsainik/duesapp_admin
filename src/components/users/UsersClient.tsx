"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/loader";

type UserRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "USER";
  // admin: string; // parent admin name
  loans?: number;
  _count?: {
    loansBorrowed?: number;
  };
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
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function UsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("123456");

  // Toggle state for form
  const [showForm, setShowForm] = useState(false);

  // ✅ Fetch users from API
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getUsers");
      const data = await res.json();
      console.log("this is the user data", data);

      if (!res.ok) throw new Error(data.error || "Failed to load users");

      setUsers(
        data.users.map((u: ApiUser) => ({
          ...u,
          role: "USER",
          admin: u.admin?.name || "Unknown Admin",
          loans: u.loansBorrowed?.length || 0,
        }))
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch users";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
      // u.admin?.toLowerCase().includes(s)
    );
  }, [q, users]);

  const totalLoans = useMemo(
    () => users.reduce((sum, u) => sum + (u._count?.loansBorrowed ?? 0), 0),
    [users]
  );

  // ✅ Create user via API
  async function addUser(e: React.FormEvent) {
    e.preventDefault();

    if (!userId.trim()) return toast.error("User ID is required");
    if (!name.trim()) return toast.error("Name is required");
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return toast.error("Valid email is required");
    if (!password.trim()) return toast.error("Password is required");

    setLoading(true);
    try {
      const res = await fetch("/api/users/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          email,
          phone,
          location,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      // Refresh user list after creating
      await fetchUsers();

      toast.success("User created successfully 🎉");

      // Reset form & close
      setUserId("");
      setName("");
      setEmail("");
      setPhone("");
      setLocation("");
      setPassword("123456");
      setShowForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function removeUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete user";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header / Search */}
      <div className="relative overflow-hidden rounded-2xl border shadow-sm p-5 sm:p-6 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-indigo-200/40 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl" />

        {/* Indigo header bar */}
        <div className="bg-indigo-500 px-4 py-3 rounded-t-2xl -mx-5 -mt-5 sm:-mx-6 sm:-mt-6">
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
                  d="M5.121 17.804A7 7 0 1118.88 7.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              User Management
            </h2>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Users
            </h2>
            <p className="text-sm text-gray-600 max-w-prose">
              Admins can create users. Each user belongs to the logged-in admin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                placeholder="Search users by name or email"
                className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:ring-1 hover:ring-indigo-200"
              />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            >
              {showForm ? "Close" : "New User"}
            </button>
          </div>
        </div>

        {/* Mini stats row to mirror LoansClient style */}
        <div className="relative mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Total Users: {users.length}
          </span>
          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            Total Loans: {totalLoans}
          </span>
        </div>
      </div>

      {/* Create User Form */}
      {showForm && (
        <form
          onSubmit={addUser}
          className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Add User
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                User ID
              </label>
              <input
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="USR001"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User Name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9999999999"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Location
              </label>
              <input
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Udaipur"
              />
            </div>
            {/* Password field removed, password is set to default */}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl border shadow-sm">
        <div className="px-4 py-3.5 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">All Users</h3>
            <p className="text-xs text-gray-500">
              Manage all borrowers under this admin
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="h-4 w-4 inline-block rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
            )}
            <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs">
              Total: {users.length}
            </span>
          </div>
        </div>

        {/* Mobile cards */}
        {!loading && (
          <div className="p-5 space-y-3 sm:hidden">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border p-4 shadow-sm bg-gradient-to-b from-white to-indigo-50/20 ring-1 ring-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-semibold shadow">
                      {initials(u.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">
                        ID: {u.userId}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-emerald-50/70 text-emerald-700 text-xs ring-1 ring-emerald-100">
                    Loans: {u._count?.loansBorrowed ?? 0}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="text-gray-800 break-all">{u.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <div className="text-gray-800">{u.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Location</div>
                    <div className="text-gray-800">{u.location || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Role</div>
                    <div className="text-gray-800">{u.role}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => removeUser(u.id)}
                    className="w-full px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    type="button"
                  >
                    Delete
                  </button>
                  <button
                    className="w-full px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  👤
                </div>
                <div className="text-sm">No users found</div>
              </div>
            )}
          </div>
        )}

        {/* Desktop table */}
        <div className="overflow-x-auto hidden sm:block mt-1 px-4 pb-4">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Phone
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Location
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Role
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Loans
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, idx) => (
                    <tr
                      key={u.id}
                      className={`border-t ${
                        idx % 2 ? "bg-white" : "bg-gray-50"
                      } hover:bg-indigo-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-semibold shadow">
                            {initials(u.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {u.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {u.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 break-all">{u.email}</td>
                      <td className="px-4 py-3">{u.phone}</td>
                      <td className="px-4 py-3">{u.location}</td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded bg-emerald-50/70 text-emerald-700 text-xs ring-1 ring-emerald-100">
                          {u._count?.loansBorrowed ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => removeUser(u.id)}
                            className="min-w-[84px] px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                            type="button"
                          >
                            Delete
                          </button>
                          <button
                            className="min-w-[84px] px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        <div className="py-10 text-center">
                          <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            👤
                          </div>
                          <div className="text-sm text-gray-500">
                            No users found
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filtered.length} users</span>
                <span className="hidden md:inline">
                  Tip: Use the search above to quickly filter users.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
