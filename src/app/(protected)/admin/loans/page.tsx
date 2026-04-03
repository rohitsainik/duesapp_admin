import React from "react";
import { LoansClient } from "@/components/loans/LoansClient";

export const metadata = {
  title: "Loans",
};

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <LoansClient />
    </div>
  );
}
