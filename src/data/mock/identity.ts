import type { StaffDemoAccount } from "../../domain";

export const mockStaffIdentityAccounts: StaffDemoAccount[] = [
  {
    id: "identity-mock-owner",
    accountId: "owner.demo",
    displayName: "老闆示範帳號",
    role: "owner",
    staffId: "staff-mock-alpha",
    accessCode: "DUM-DEMO",
    active: true,
  },
  {
    id: "identity-mock-staff",
    accountId: "staff.demo",
    displayName: "職員示範帳號",
    role: "staff",
    staffId: "staff-mock-bravo",
    accessCode: "DUM-DEMO",
    active: true,
  },
];
