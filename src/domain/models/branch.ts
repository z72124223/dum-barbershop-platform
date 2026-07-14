import type { EntityId } from "./common";

export interface Branch {
  id: EntityId;
  name: string;
  timeZone: "Asia/Taipei";
  addressLabel: string;
  active: boolean;
}
