// app/layout.tsx
import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata = {
  title: "Duesbook — Loan Management",
  description: "Role-based loan management platform for admins and super admins",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.variable} font-sans h-full bg-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}