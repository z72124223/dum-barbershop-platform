import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileBookingCta } from "@/components/layout/mobile-booking-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: { default: "DUM BARBERSHOP", template: "%s — DUM BARBERSHOP" },
  description: "DUM BARBERSHOP 官方網站、線上預約與多人工作室營運平台——本機示範版。",
  applicationName: "DUM BARBERSHOP",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "DUM BARBERSHOP", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#100b0b", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body><SiteHeader />{children}<SiteFooter /><MobileBookingCta /></body></html>;
}
