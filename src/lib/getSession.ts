import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";

export interface SessionPayload {
  id: string;
  userId: string;
  name: string;
  role: string;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value; // ✅ read access token

    if (!token) return null;

    const payload = await verifyAccessToken(token); // ✅ ACCESS_SECRET matches

    return {
      id: payload.id as string,
      userId: payload.userId as string,
      name: payload.name as string,
      role: ((payload.role as string) ?? "").toLowerCase(),
    };
  } catch {
    return null;
  }
}