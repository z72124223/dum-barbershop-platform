"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBookingCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/booking") || pathname.startsWith("/staff")) return null;
  return <Link className="mobile-booking-cta" href="/booking" aria-label="前往預約功能入口">立即預約 · 本機示範</Link>;
}
