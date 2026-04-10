import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { verifyAccessToken } from "@/lib/jwt";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) redirect("/auth/login");

  try {
    await verifyAccessToken(token);
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <DashboardClient />
    </div>
  );
}