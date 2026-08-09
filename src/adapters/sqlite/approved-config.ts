import { randomUUID } from "node:crypto";
import type { ControlledSqliteConnection } from "./connection";

export const APPROVED_SLOT_DURATION_MINUTES = 60;
export const APPROVED_FIRST_SLOT_MINUTES = 10 * 60;
export const APPROVED_LAST_SLOT_MINUTES = 18 * 60;
export const APPROVED_AVAILABILITY_END_MINUTES = 19 * 60;
export const APPROVED_BOOKING_DAYS = 7;

interface ExistingStaffRow {
  id: string;
  role: "owner" | "staff";
  public_label: string;
  is_active: number;
}

interface ExistingServiceRow {
  id: string;
  code: string;
  duration_minutes: number;
  is_active: number;
}

export class ApprovedScheduleConfigError extends Error {
  readonly name = "ApprovedScheduleConfigError";

  constructor() {
    super("The approved schedule configuration failed integrity checks.");
  }
}

const APPROVED_STAFF = [
  { role: "owner" as const, publicLabel: "老闆" },
  { role: "staff" as const, publicLabel: "職員" },
];

export function provisionApprovedScheduleConfig(
  database: ControlledSqliteConnection,
  now = new Date(),
): void {
  const provision = database.transaction(() => {
    const createdAt = now.toISOString();

    for (const approved of APPROVED_STAFF) {
      const rows = database.prepare(`
        SELECT id, role, public_label, is_active
        FROM staff_members
        WHERE role = ? AND public_label = ?
      `).all(approved.role, approved.publicLabel) as ExistingStaffRow[];

      if (rows.length > 1) throw new ApprovedScheduleConfigError();
      if (rows.length === 0) {
        database.prepare(`
          INSERT INTO staff_members (
            id, role, public_label, is_active, created_at_utc
          ) VALUES (?, ?, ?, 1, ?)
        `).run(randomUUID(), approved.role, approved.publicLabel, createdAt);
      } else if (rows[0].is_active !== 1) {
        throw new ApprovedScheduleConfigError();
      }
    }

    const serviceRows = database.prepare(`
      SELECT id, code, duration_minutes, is_active
      FROM service_definitions
      WHERE code = 'standard_booking'
    `).all() as ExistingServiceRow[];

    if (serviceRows.length > 1) throw new ApprovedScheduleConfigError();
    if (serviceRows.length === 0) {
      database.prepare(`
        INSERT INTO service_definitions (
          id, code, duration_minutes, is_active, created_at_utc
        ) VALUES (?, 'standard_booking', ?, 1, ?)
      `).run(randomUUID(), APPROVED_SLOT_DURATION_MINUTES, createdAt);
    } else if (
      serviceRows[0].duration_minutes !== APPROVED_SLOT_DURATION_MINUTES
      || serviceRows[0].is_active !== 1
    ) {
      throw new ApprovedScheduleConfigError();
    }

    const staffRows = database.prepare(`
      SELECT id, role, public_label, is_active
      FROM staff_members
      WHERE (role = 'owner' AND public_label = '老闆')
         OR (role = 'staff' AND public_label = '職員')
      ORDER BY role
    `).all() as ExistingStaffRow[];

    if (staffRows.length !== APPROVED_STAFF.length) {
      throw new ApprovedScheduleConfigError();
    }

    const insertAvailability = database.prepare(`
      INSERT INTO staff_availability_windows (
        id,
        staff_member_id,
        weekday,
        start_time_minutes,
        end_time_minutes,
        created_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (staff_member_id, weekday) DO NOTHING
    `);
    const readAvailability = database.prepare(`
      SELECT start_time_minutes, end_time_minutes
      FROM staff_availability_windows
      WHERE staff_member_id = ? AND weekday = ?
    `);

    for (const staff of staffRows) {
      for (let weekday = 0; weekday < 7; weekday += 1) {
        insertAvailability.run(
          randomUUID(),
          staff.id,
          weekday,
          APPROVED_FIRST_SLOT_MINUTES,
          APPROVED_AVAILABILITY_END_MINUTES,
          createdAt,
        );
        const window = readAvailability.get(staff.id, weekday) as {
          start_time_minutes: number;
          end_time_minutes: number;
        } | undefined;
        if (
          !window
          || window.start_time_minutes !== APPROVED_FIRST_SLOT_MINUTES
          || window.end_time_minutes !== APPROVED_AVAILABILITY_END_MINUTES
        ) {
          throw new ApprovedScheduleConfigError();
        }
      }
    }

    const exactCounts = database.prepare(`
      SELECT
        (SELECT count(*) FROM staff_members) AS staff_count,
        (SELECT count(*) FROM service_definitions) AS service_count,
        (SELECT count(*) FROM staff_availability_windows) AS availability_count
    `).get() as {
      staff_count: number;
      service_count: number;
      availability_count: number;
    };
    if (
      exactCounts.staff_count !== 2
      || exactCounts.service_count !== 1
      || exactCounts.availability_count !== 14
    ) {
      throw new ApprovedScheduleConfigError();
    }
  });

  try {
    provision.immediate();
  } catch (error) {
    if (error instanceof ApprovedScheduleConfigError) throw error;
    throw new ApprovedScheduleConfigError();
  }
}
