import type { CalendarBlock, EntityId } from "../../domain";

export interface CalendarProvider {
  listBlocks(staffId?: EntityId): Promise<CalendarBlock[]>;
  createBlock(block: CalendarBlock): Promise<CalendarBlock>;
}
