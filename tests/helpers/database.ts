import { DataSource } from "typeorm";
import { User } from "../../src/core/users/user.entity";
import { Event } from "../../src/core/events/event.entity";
import { Ticket } from "../../src/core/tickets/ticket.entity";
import { Reservation } from "../../src/core/reservations/reservation.entity";
import { Payment } from "../../src/core/payments/payment.entity";

export const TestDataSource = new DataSource({
  type: "postgres",

  host: process.env.TEST_DB_HOST || "localhost",

  port: Number(process.env.TEST_DB_PORT) || 5432,

  username: process.env.TEST_DB_USERNAME || "postgres",

  password: process.env.TEST_DB_PASSWORD || "password",

  database: process.env.TEST_DB_NAME || "ticket_express_test",

  entities: [User, Event, Ticket, Reservation, Payment],

  synchronize: true,

  logging: false,
});

export async function clearDatabase() {
  const entities = TestDataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = TestDataSource.getRepository(entity.name);

    await repository.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
    );
  }
}
