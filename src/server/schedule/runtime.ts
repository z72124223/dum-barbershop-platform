import {
  createSqliteScheduleEntryRepository,
  provisionApprovedScheduleConfig,
} from "@/adapters/sqlite";
import type { ScheduleEntryRepository } from "@/domain/schedule";
import { getFormalAuthRuntime, type FormalAuthRuntime } from "@/server/auth";
import {
  readCollectionNoticeConfiguration,
  type CollectionNoticeConfiguration,
} from "./collection-notice";

export interface ScheduleServerRuntime {
  authRuntime: FormalAuthRuntime;
  repository: ScheduleEntryRepository;
  notice: CollectionNoticeConfiguration;
}

export function createScheduleServerRuntime(
  authRuntime: FormalAuthRuntime,
  notice: CollectionNoticeConfiguration,
): ScheduleServerRuntime {
  provisionApprovedScheduleConfig(authRuntime.database);
  return {
    authRuntime,
    repository: createSqliteScheduleEntryRepository(authRuntime.database),
    notice,
  };
}

let runtime: ScheduleServerRuntime | undefined;

export function initializeScheduleServerRuntime(
  environment: NodeJS.ProcessEnv = process.env,
  authRuntimeFactory: () => FormalAuthRuntime = getFormalAuthRuntime,
): ScheduleServerRuntime {
  const notice = readCollectionNoticeConfiguration(environment);
  return createScheduleServerRuntime(authRuntimeFactory(), notice);
}

export function getScheduleServerRuntime(): ScheduleServerRuntime {
  if (!runtime) {
    runtime = initializeScheduleServerRuntime();
  }
  return runtime;
}
