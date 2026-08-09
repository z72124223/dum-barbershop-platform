import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { ControlledSqliteConnection } from "../../adapters/sqlite";
import type { FormalStaffRole } from "./authorization";

export class StaffAccountAdministrationError extends Error {
  readonly name = "StaffAccountAdministrationError";

  constructor() {
    super("The staff account operation could not be completed safely.");
  }
}
interface StaffProvisioningRow {
  id: string;
  public_label: string;
  is_active: number;
  auth_user_id: string | null;
}

function normalizeProvisioningUsername(username: string): string {
  const normalized = username.trim().toLocaleLowerCase("en-US");
  if (
    normalized.length < 3
    || normalized.length > 30
    || !/^[a-z0-9._]+$/.test(normalized)
  ) {
    throw new StaffAccountAdministrationError();
  }
  return normalized;
}

function validatePassword(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new StaffAccountAdministrationError();
  }
}

export async function provisionStaffAccount(
  database: ControlledSqliteConnection,
  input: { role: FormalStaffRole; username: string; password: string },
  now = new Date(),
): Promise<{ staffId: string; authUserId: string; role: FormalStaffRole }> {
  const username = normalizeProvisioningUsername(input.username);
  validatePassword(input.password);
  const passwordHash = await hashPassword(input.password);
  const timestamp = now.toISOString();
  const authUserId = randomUUID();
  const accountId = randomUUID();

  const provision = database.transaction(() => {
    const staff = database.prepare(`
      SELECT id, public_label, is_active, auth_user_id
      FROM staff_members
      WHERE role = ?
    `).get(input.role) as StaffProvisioningRow | undefined;
    if (!staff || staff.is_active !== 1 || staff.auth_user_id !== null) {
      throw new StaffAccountAdministrationError();
    }

    database.prepare(`
      INSERT INTO "user" (
        id,
        name,
        email,
        emailVerified,
        image,
        createdAt,
        updatedAt,
        username,
        displayUsername
      ) VALUES (?, ?, ?, 1, NULL, ?, ?, ?, ?)
    `).run(
      authUserId,
      staff.public_label,
      `${authUserId}@staff.invalid`,
      timestamp,
      timestamp,
      username,
      input.username.trim(),
    );
    database.prepare(`
      INSERT INTO account (
        id,
        accountId,
        providerId,
        userId,
        password,
        createdAt,
        updatedAt
      ) VALUES (?, ?, 'credential', ?, ?, ?, ?)
    `).run(
      accountId,
      authUserId,
      authUserId,
      passwordHash,
      timestamp,
      timestamp,
    );
    const linked = database.prepare(`
      UPDATE staff_members
      SET auth_user_id = ?
      WHERE id = ? AND auth_user_id IS NULL AND is_active = 1
    `).run(authUserId, staff.id);
    if (linked.changes !== 1) throw new StaffAccountAdministrationError();

    return { staffId: staff.id, authUserId, role: input.role };
  });

  try {
    return provision.immediate();
  } catch (error) {
    if (error instanceof StaffAccountAdministrationError) throw error;
    throw new StaffAccountAdministrationError();
  }
}

export async function rotateStaffPassword(
  database: ControlledSqliteConnection,
  staffId: string,
  password: string,
  now = new Date(),
): Promise<void> {
  validatePassword(password);
  const passwordHash = await hashPassword(password);
  const rotate = database.transaction(() => {
    const staff = database.prepare(`
      SELECT auth_user_id
      FROM staff_members
      WHERE id = ? AND is_active = 1 AND auth_user_id IS NOT NULL
    `).get(staffId) as { auth_user_id: string } | undefined;
    if (!staff) throw new StaffAccountAdministrationError();

    const updated = database.prepare(`
      UPDATE account
      SET password = ?, updatedAt = ?
      WHERE userId = ? AND providerId = 'credential'
    `).run(passwordHash, now.toISOString(), staff.auth_user_id);
    if (updated.changes !== 1) throw new StaffAccountAdministrationError();
    database.prepare(`DELETE FROM session WHERE userId = ?`).run(
      staff.auth_user_id,
    );
  });

  try {
    rotate.immediate();
  } catch (error) {
    if (error instanceof StaffAccountAdministrationError) throw error;
    throw new StaffAccountAdministrationError();
  }
}

export function deactivateStaffAccount(
  database: ControlledSqliteConnection,
  staffId: string,
): void {
  const deactivate = database.transaction(() => {
    const staff = database.prepare(`
      SELECT auth_user_id
      FROM staff_members
      WHERE id = ? AND is_active = 1 AND auth_user_id IS NOT NULL
    `).get(staffId) as { auth_user_id: string } | undefined;
    if (!staff) throw new StaffAccountAdministrationError();
    const updated = database.prepare(`
      UPDATE staff_members SET is_active = 0 WHERE id = ? AND is_active = 1
    `).run(staffId);
    if (updated.changes !== 1) throw new StaffAccountAdministrationError();
    database.prepare(`DELETE FROM session WHERE userId = ?`).run(
      staff.auth_user_id,
    );
  });

  try {
    deactivate.immediate();
  } catch (error) {
    if (error instanceof StaffAccountAdministrationError) throw error;
    throw new StaffAccountAdministrationError();
  }
}
