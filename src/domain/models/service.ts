import type { EntityId } from "./common";

export type ServiceCategory = "cut" | "shave" | "perm" | "color" | "care" | "combo";

export interface Service {
  id: EntityId;
  name: string;
  category: ServiceCategory;
  description: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  priceLabel: string;
  active: boolean;
}
