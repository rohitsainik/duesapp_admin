import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getRoleHome } from "@/lib/nav";
import { verifyAccessToken } from "@/lib/jwt";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      const role = payload.role as "admin" | "superadmin" | "user" | undefined;
      redirect(getRoleHome(role));
    } catch {
      // token invalid or expired, just show login page
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 p-6">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}