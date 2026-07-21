import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../core/users/user.entity";
import { Event } from "../core/events/event.entity";
import { Reservation } from "../core/reservations/reservation.entity";
import { Ticket } from "../core/tickets/ticket.entity";
import { Payment } from "../core/payments/payment.entity";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database:
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DB_NAME
      : process.env.DB_NAME,
  synchronize: true,
  logging: true,
  // TODO : add another entities
  entities: [User, Reservation, Event, Ticket, Payment],
  migrations: ["src/migrations/**/*.ts"],
});

export default AppDataSource;
