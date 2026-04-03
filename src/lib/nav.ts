export function getRoleHome(role?: AppRole) {
  if (role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

export type AppRole = "admin" | "superadmin" | "user";

export const NAV_ITEMS: Record<AppRole, { href: string; label: string; icon: string }[]> = {
  superadmin: [
    { href: "/superadmin", label: "Dashboard", icon: "🏠" },
    { href: "/superadmin/admins", label: "Admins", icon: "🛡️" },
    { href: "/superadmin/users", label: "Users", icon: "👥" },
    { href: "/superadmin/loans", label: "Loans", icon: "💳" },
    { href: "/superadmin/account", label: "Accounts / Reports", icon: "📊" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: "🏠" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/loans", label: "Loans", icon: "💳" },
    { href: "/admin/account", label: "Reports / Account", icon: "📊" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ],
  user: [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/loans", label: "Loans", icon: "💳" },
    { href: "/reports", label: "Reports", icon: "📊" },
  ],
};