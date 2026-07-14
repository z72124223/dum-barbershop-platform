import type { StaffRole } from "../../domain";

export interface PreviewIdentitySession {
  mode: "mock";
  authenticated: false;
  previewRole: StaffRole;
  permissions: string[];
}

export interface IdentityProvider {
  getPreviewSession(role?: StaffRole): Promise<PreviewIdentitySession>;
}
