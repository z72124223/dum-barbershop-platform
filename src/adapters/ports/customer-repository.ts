import type { Customer, EntityId } from "../../domain";

export interface CustomerRepository {
  list(): Promise<Customer[]>;
  findById(id: EntityId): Promise<Customer | null>;
  search(query: string): Promise<Customer[]>;
  save(customer: Customer): Promise<Customer>;
}
