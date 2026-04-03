"use client";

import React, { useMemo, useState } from "react";

export type Admin = { id: string; name: string; email: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function AdminsClient() {
  // Seed with Admin A; replace with API fetch later
  const [admins, setAdmins] = useState<Admin[]>([
    { id: "adminA", name: "Admin A", email: "a@example.com" },
  ]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return admins;
    const s = q.toLowerCase();
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s)
    );
  }, [q, admins]);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setError("Valid email is required");
    if (admins.some((a) => a.email.toLowerCase() === email.toLowerCase()))
      return setError("Email already exists");

    setAdmins((prev) => [
      { id: uid(), name: name.trim(), email: email.trim() },
      ...prev,
    ]);
    setName("");
    setEmail("");
  }

  function removeAdmin(id: string) {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <section className="space-y-6">
      {/* Header (same style as dashboard/loans) */}
      <div className="rounded-2xl border shadow-sm p-6 bg-gradient-to-r from-white to-gray-50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Admins
            </h2>
            <p className="text-sm text-gray-600">
              Create and manage administrators (static UI)
            </p>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admin by name or email"
              className="pl-9 pr-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create admin form */}
        <form
          onSubmit={addAdmin}
          className="bg-white border rounded-2xl p-5 shadow-sm lg:col-span-1"
        >
          <h3 className="text-base font-semibold mb-4 text-gray-900">
            Add Admin
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  👤
                </span>
                <input
                  className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ✉️
                </span>
                <input
                  className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  type="email"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow">
              Create
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="lg:col-span-2 bg-white border rounded-2xl shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                All Admins
              </h4>
              <p className="text-xs text-gray-500">Total: {filtered.length}</p>
            </div>
          </div>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-gray-600">Admin</th>
                    <th className="px-3 py-2 text-gray-600">Email</th>
                    <th className="px-3 py-2 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={idx % 2 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-3 text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow">
                            {initials(a.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {a.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {a.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-800">{a.email}</td>
                      <td className="px-3 py-3 space-x-2">
                        <button
                          onClick={() => removeAdmin(a.id)}
                          className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs"
                          type="button"
                          aria-label={`Delete ${a.name}`}
                        >
                          Delete
                        </button>
                        <button
                          className="px-3 py-1 rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow text-xs"
                          type="button"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                🗂️
              </div>
              <p className="text-sm">
                No admins found. Try clearing the search or create a new admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
