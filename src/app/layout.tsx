import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "@/components/provider/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Loan Management App",
  description: "Admin & Super Admin panels with role-based access",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
