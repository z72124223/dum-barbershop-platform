import type { ReactNode } from "react";
import { MobileBookingCta } from "@/components/layout/mobile-booking-cta";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <MobileBookingCta />
    </>
  );
}
