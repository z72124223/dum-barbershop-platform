import type { ReactNode } from "react";
import { StaffAuthBoundary } from "@/features/staff/staff-auth";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <StaffAuthBoundary>{children}</StaffAuthBoundary>;
}
