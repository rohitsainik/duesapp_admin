import { prisma } from "@/lib/dbConnect";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

export const runtime = "nodejs";

export const authOptions = {
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.userId || !creds?.password) return null;

        const user = await prisma.user.findUnique({
          where: { userId: creds.userId },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          userId: user.userId,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
callbacks: {
  async jwt(
    { token, user }: { token: JWT; user?: User | AdapterUser | null }
  ) {
    if (user) {
      token.id = user.id;
      token.userId = user.userId;

      // normalize DB roles into frontend-friendly roles
      switch ((user.role as string).toUpperCase()) {
        case "SUPER_ADMIN":
          token.role = "superadmin";
          break;
        case "ADMIN":
          token.role = "admin";
          break;
        case "USER":
        default:
          token.role = "user";
          break;
      }
    }
    return token; // ✅ always return token outside if
  },

  async session(
    { session, token }: {
      session: Session & { user: { id?: string; userId?: string; role?: string } };
      token: JWT;
    }
  ) {
    if (session.user) {
      session.user.id = token.id;
      session.user.userId = token.userId;
      session.user.role = token.role;
    }
    return session;
  },
},
  pages: { signIn: "../../auth/login" }, // ✅ matches your folder
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };