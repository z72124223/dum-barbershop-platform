import type { StaffDemoAccount } from "../../domain";

export const mockStaffIdentityAccounts: StaffDemoAccount[] = [
  {
    id: "identity-mock-owner",
    accountId: "owner.demo",
    displayName: "店主示範帳號",
    role: "owner",
    staffId: "staff-mock-alpha",
    accessCode: "DUM-DEMO",
    active: true,
  },
  {
    id: "identity-mock-manager",
    accountId: "manager.demo",
    displayName: "管理者示範帳號",
    role: "manager",
    accessCode: "DUM-DEMO",
    active: true,
  },
  {
    id: "identity-mock-barber",
    accountId: "barber.demo",
    displayName: "設計師示範帳號",
    role: "barber",
    staffId: "staff-mock-bravo",
    accessCode: "DUM-DEMO",
    active: true,
  },
  {
    id: "identity-mock-reception",
    accountId: "reception.demo",
    displayName: "櫃台示範帳號",
    role: "reception",
    accessCode: "DUM-DEMO",
    active: true,
  },
  {
    id: "identity-mock-read-only",
    accountId: "readonly.demo",
    displayName: "唯讀示範帳號",
    role: "read_only",
    accessCode: "DUM-DEMO",
    active: true,
  },
];
