import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "../core/users/user.entity";
import { Reservation } from "../entities/reservation.entity";
import { Event } from "../entities/event.entity";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "postgres",
  synchronize: true,
  logging: true,
  // TODO : add another entities
  entities: [User, Reservation, Event],
  migrations: ["src/migrations/**/*.ts"],
});

export default AppDataSource;
