import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../core/users/user.entity";
import { Event } from "../core/events/event.entity";
import { Reservation } from "../core/reservations/reservation.entity";
import { Ticket } from "../core/tickets/ticket.entity";
import { Payment } from "../core/payments/payment.entity";

dotenv.config();

const isTestEnv = process.env.NODE_ENV === "test";
const isDockerEnv = process.env.IS_DOCKER === "true";
const dbHost = isTestEnv
  ? process.env.TEST_DB_HOST || (isDockerEnv ? process.env.DB_HOST || "postgres" : process.env.DB_HOST || "localhost")
  : isDockerEnv
    ? process.env.DB_HOST || "postgres"
    : process.env.DB_HOST || "localhost";
const dbPort = Number(
  isTestEnv ? process.env.TEST_DB_PORT || process.env.DB_PORT : process.env.DB_PORT,
) || 5432;
const dbUsername = isTestEnv
  ? process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || "postgres"
  : process.env.DB_USERNAME || "postgres";
const dbPassword = isTestEnv
  ? process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || "password"
  : process.env.DB_PASSWORD || "password";
const dbName = isTestEnv
  ? process.env.TEST_DB_NAME || process.env.DB_NAME || "ticket_express_test"
  : process.env.DB_NAME || "ticket_db";

const AppDataSource = new DataSource({
  type: "postgres",
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  // TODO : add another entities
  entities: [User, Reservation, Event, Ticket, Payment],
  migrations: [
    process.env.NODE_ENV === "development"
      ? "src/migrations/**/*.ts"
      : "dist/migrations/**/*.js",
  ],
});

export default AppDataSource;
