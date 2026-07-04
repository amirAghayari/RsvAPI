import { UserRepository } from "./users/user.repository";
import AppDataSource from "../config/dataSource";
import { UserService } from "./users/services/user.service";
import { AuthService } from "./users/services/auth.service";
import { UserController } from "./users/controllers/user.controller";
import { AuthController } from "./users/controllers/auth.controller";
import { EventRepository } from "./events/event.repository";
import { EventService } from "./events/services/event.service";
import { EventController } from "./events/controllers/event.controller";
import { CloudinaryService } from "./cloudinary/services/cloudinary.service";
import { TicketService } from "./tickets/services/ticket.service";
import { TicketRepository } from "./tickets/ticket.repository";
import { TicketController } from "./tickets/controllers/ticket.controller";

import { ReservationService } from "./reservations/services/reservation.service";
import { ReservationRepository } from "./reservations/reservation.repository";
import { ReservationController } from "./reservations/controllers/reservation.controller";
import { PaymentRepository } from "./payments/payment.repository";
import { PaymentService } from "./payments/services/payment.service";
import { PaymentController } from "./payments/controllers/payment.controller";

export const userRepository = new UserRepository(AppDataSource);
export const eventRepository = new EventRepository(AppDataSource);
export const ticketRepository = new TicketRepository(AppDataSource);
export const reservationRepository = new ReservationRepository(AppDataSource);
export const paymentRepository = new PaymentRepository(AppDataSource);

export const cloudinaryService = new CloudinaryService();
export const userService = new UserService(userRepository, cloudinaryService);
export const authService = new AuthService(userRepository);
export const ticketService = new TicketService(
  ticketRepository,
  eventRepository,
);
export const eventService = new EventService(eventRepository, ticketRepository);
export const reservationService = new ReservationService(
  reservationRepository,
  userRepository,
  eventRepository,
  ticketRepository,
  AppDataSource,
);
export const paymentService = new PaymentService(
  paymentRepository,
  reservationRepository,
  ticketRepository,
  userRepository,
  AppDataSource,
);

export const userController = new UserController(userService);
export const authController = new AuthController(authService);
export const eventController = new EventController(eventService);
export const reservationController = new ReservationController(
  reservationService,
);
export const ticketController = new TicketController(ticketService);
export const paymentController = new PaymentController(paymentService);
