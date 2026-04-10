import { prisma } from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "admin" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { adminId: session.id },
    select: { id: true, userId: true, name: true },
  });

  return NextResponse.json(users);
}