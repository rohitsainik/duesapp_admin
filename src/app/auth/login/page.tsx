import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getRoleHome } from "@/lib/nav";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as
    | "admin"
    | "superadmin"
    | "user"
    | undefined;

  if (role) {
    redirect(getRoleHome(role));
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 p-6">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
