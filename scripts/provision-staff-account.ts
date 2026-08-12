import { applyScheduleMigrations, openControlledSqliteConnection } from "../src/adapters/sqlite";
import { provisionStaffAccount, readStaffAuthEnvironment } from "../src/server/auth";

async function main(): Promise<void> {
  const role = process.argv[2];
  const username = process.env.DUM_STAFF_USERNAME;
  const password = process.env.DUM_STAFF_PASSWORD;
  if ((role !== "owner" && role !== "staff") || !username || !password) {
    throw new Error(
      "Usage: set DUM_STAFF_USERNAME and DUM_STAFF_PASSWORD, then run with owner or staff.",
    );
  }

  const environment = readStaffAuthEnvironment();
  const database = openControlledSqliteConnection(environment.databasePath);
  try {
    applyScheduleMigrations(database);
    const result = await provisionStaffAccount(database, {
      role,
      username,
      password,
    });
    process.stdout.write(
      `Provisioned ${result.role} staff binding ${result.staffId}.\n`,
    );
  } finally {
    database.close();
  }
}

main().catch(() => {
  process.stderr.write("Staff account provisioning failed safely.\n");
  process.exitCode = 1;
});
