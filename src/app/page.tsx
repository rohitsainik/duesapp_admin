import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If no user session, redirect to login
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <DashboardClient />
    </div>
  );
}
