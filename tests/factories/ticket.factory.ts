import { Ticket } from "../../src/core/tickets/ticket.entity";
import { TestDataSource } from "../helpers/database";

export const ticketsUrl = "/api/V1/tickets";

export async function createTicket(data?: Partial<Ticket>) {
  const repository = TestDataSource.getRepository(Ticket);

  const ticket = repository.create({
    title: "Test Title",
    price: 100,
    capacity: 10,
    saleStartsAt: new Date(),
    saleEndsAt: new Date(Date.now() + 200000),

    ...data,
  });

  return repository.save(ticket);
}
