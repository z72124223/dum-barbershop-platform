import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "DUM BARBERSHOP", template: "%s — DUM BARBERSHOP" },
  description: "DUM BARBERSHOP website, booking and multi-staff operation platform — local mock prototype."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
