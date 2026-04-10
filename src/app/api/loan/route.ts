import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/dbConnect";
import { InterestMethod } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    const callerId = payload.id as string;
    const role = ((payload.role as string) ?? "").toUpperCase();

    if (!callerId || (role !== "ADMIN" && role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const {
      borrowerId,
      principal,
      rate,
      months,
      startDate,
      endDate,
      interestMethod: interestMethodRaw,
      lockIn = false,
      minMonthsFloor = 0,
      notes,
      isSecured = false,
      totalInterest,
      totalPayable,
      collaterals = [],
    } = body || {};

    // Ensure interestMethod matches Prisma enum values coming from frontend
    const allowedInterestMethods = Object.values(InterestMethod);
    const interestMethod = allowedInterestMethods.includes(interestMethodRaw)
      ? (interestMethodRaw as InterestMethod)
      : InterestMethod.SIMPLE;

    // 1) Verify borrower exists and is owned by this admin (borrower.adminId === callerId)
    const borrower = await prisma.user.findUnique({
      where: { id: borrowerId },
      select: { id: true, role: true, adminId: true, name: true },
    });
    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }
    if (borrower.role !== "USER") {
      return NextResponse.json({ error: "Borrower must have role USER" }, { status: 400 });
    }
    if (borrower.adminId !== callerId) {
      return NextResponse.json({ error: "Borrower does not belong to this admin" }, { status: 403 });
    }

    // Removed calculation block and addMonthsToDate call

    // 4) Persist (use string inputs for Decimal)
    type CollateralInput = {
      type: string;
      title: string;
      description?: string | null;
      estimatedValue: number | string;
      status?: string;
      appraisalAt?: string | Date | null;
      notes?: string | null;
      documentUrls?: string[];
    };
    const created = await prisma.loan.create({
      data: {
        borrowerId,
        adminId: callerId, // from request session (the admin)
        principal: String(principal),
        rate: String(rate),
        months,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        interestMethod,
        lockIn,
        minMonthsFloor,
        status: "ACTIVE",
        totalInterest: totalInterest != null ? String(totalInterest) : null,
        totalPayable: totalPayable != null ? String(totalPayable) : null,
        notes: notes ?? null,
        isSecured,

        // optional collaterals create
        ...(collaterals.length
          ? {
              collaterals: {
                create: collaterals.map((c: CollateralInput) => ({
                  type: c.type,
                  title: c.title,
                  description: c.description ?? null,
                  estimatedValue: String(c.estimatedValue),
                  status: c.status ?? "PLEDGED",
                  appraisalAt: c.appraisalAt ? new Date(c.appraisalAt) : null,
                  notes: c.notes ?? null,
                  documentUrls: c.documentUrls ?? [],
                })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        borrowerId: true,
        adminId: true,
        principal: true,
        rate: true,
        months: true,
        startDate: true,
        endDate: true,
        interestMethod: true,
        lockIn: true,
        minMonthsFloor: true,
        status: true,
        totalInterest: true,
        totalPayable: true,
        isSecured: true,
        createdAt: true,
        borrower: { select: { id: true, name: true, userId: true } },
      },
    });

    return NextResponse.json({ ok: true, loan: created }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2003") {
      // FK constraint
      return NextResponse.json({ error: "Invalid borrower/admin reference" }, { status: 400 });
    }
    console.error("POST /api/loans error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}