import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* sidebar on the left */}
      <Sidebar />

      {/* main area with header */}
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
