"use client";

import { UserLoanReport } from "@/components/users/UserLoanReport";
import { useParams, useRouter } from "next/navigation";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  if (!id) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        Loading user details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <header className="rounded-2xl border border-gray-200 shadow-sm bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Loan Report for{" "}
              <span className="text-indigo-600 font-semibold">{id}</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Overview of loan summary, installment schedule, and payment
              receipts for this user.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition-colors"
          >
            ← Back
          </button>
        </header>

        {/* Loan Report Component */}
        <section className="rounded-2xl bg-white border shadow-sm p-4 sm:p-6">
          {/* <UserLoanReport userId={id} /> */}
        </section>
      </div>
    </div>
  );
}
