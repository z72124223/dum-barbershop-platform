import type { Metadata } from "next";
import "./globals.css";
import { MobileBookingCta } from "@/components/layout/mobile-booking-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: { default: "DUM BARBERSHOP", template: "%s — DUM BARBERSHOP" },
  description: "DUM BARBERSHOP public platform shell — M1 fictional local prototype."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body><SiteHeader />{children}<SiteFooter /><MobileBookingCta /></body></html>;
}
