"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBookingCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/booking") || pathname.startsWith("/staff")) return null;
  return <Link className="mobile-booking-cta" href="/booking" aria-label="前往客戶預約">客戶預約</Link>;
}
