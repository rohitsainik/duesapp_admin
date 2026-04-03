"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserLoanReport } from "@/components/users/UserLoanReport";

/** ========== Loan Report Types (page-level) ========== */
export type LoanReportUser = {
  id: string;
  name: string | null;
  email: string | null;
  admin?: string; // optional (if you add it later)
};

export type LoanReportLoan = {
  id: string;
  principal: number; // number (Decimal serialized in API)
  rate: number; // number
  months: number;
  start: string; // ISO yyyy-mm-dd (from startDate)
  interestMethod: string; // enum string
  totalInterest: number;
  totalPayable: number;
  depositedPrincipal?: number;
  depositedInterest?: number;
  status: string;
};

export type LoanReportReceipt = {
  id: string;
  loanId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  recordedBy: string;
  note?: string;
  targetIdx?: number;
  depositedAt?: string;
  principal: number;
};

type ApiResponseLegacy = {
  user: LoanReportUser;
  loans: LoanReportLoan[];
};

type ApiResponseDetails = {
  user: LoanReportUser;
  loans: LoanReportLoan[];
  receipts: LoanReportReceipt[];
};

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userMeta, setUserMeta] = useState<LoanReportUser | null>(null);
  const [loans, setLoans] = useState<LoanReportLoan[]>([]);
  const [receipts, setReceipts] = useState<LoanReportReceipt[]>([]); // empty for now

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [resLegacy, resDetails] = await Promise.all([
          fetch(`/api/loan/${userId}`, { cache: "no-store" }),
          fetch(`/api/loan/getLoanDetails?userId=${userId}`, {
            cache: "no-store",
          }),
        ]);
        if (!resLegacy.ok) {
          const data = await resLegacy.json().catch(() => ({}));
          throw new Error(
            data?.error || `Failed to load loans (${resLegacy.status})`
          );
        }
        if (!resDetails.ok) {
          const data2 = await resDetails.json().catch(() => ({}));
          throw new Error(
            data2?.error || `Failed to load receipts (${resDetails.status})`
          );
        }
        const legacy: ApiResponseLegacy = await resLegacy.json();
        const details: ApiResponseDetails = await resDetails.json();
        const userFrom = legacy?.user || details?.user || null;
        setUserMeta(userFrom);
        setLoans(legacy?.loans || []);
        setReceipts(details?.receipts || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 text-sm">
        Invalid user id
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading user loan details…
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Error</h1>
            <button
              onClick={() => router.back()}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              ← Back
            </button>
          </div>
          <p className="mt-3 text-sm text-rose-600">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!userMeta) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        User not found
      </div>
    );
  }

  return (
    // <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div className="min-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <header className="rounded-2xl border border-gray-200 shadow-sm bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Loan Details —{" "}
            <span className="text-indigo-600 font-semibold">
              {userMeta.name || userMeta.id}
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {userMeta.email ? (
              <>
                Email: <span className="font-medium">{userMeta.email}</span>
              </>
            ) : (
              "User details"
            )}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition-colors"
        >
          ← Back
        </button>
      </header>

      {/* Loan Report Component (now fully dynamic) */}
      <UserLoanReport
        userId={userMeta.id}
        userMeta={{
          id: userMeta.id,
          name: userMeta.name ?? userMeta.id,
          email: userMeta.email ?? "-",
          admin: "Admin", // if you have it in API, pass real value
        }}
        loans={loans}
        receipts={receipts}
      />
    </div>
    // </div>
  );
}
