import { Event } from "../../src/core/events/event.entity";
import { TestDataSource } from "../helpers/database";

export const usersUrl = "/api/V1/users";

let userCounter = 0;

export async function createEvent(data?: Partial<Event>) {
  const repository = TestDataSource.getRepository(Event);

  userCounter++;

  const event = repository.create({
    title: `Test title`,
    location: "Test location",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 200000),

    ...data,
  });

  return repository.save(event);
}
