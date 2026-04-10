// app/(protected)/layout.tsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/jwt";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("refresh_token")?.value;

  if (!token) redirect("/auth/login");

  try {
    await verifyAccessToken(token);
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — fixed height, scrolls independently */}
      <Sidebar />

      {/* Right column: header + scrollable content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}