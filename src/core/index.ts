import { UserRepository } from "./users/user.repository";
import AppDataSource from "../config/dataSource";
import { UserService } from "./users/services/user.service";
import { AuthService } from "./users/services/auth.service";
import { UserController } from "./users/controllers/user.controller";
import { AuthController } from "./users/controllers/auth.controller";
import { RefreshTokenService } from "./users/services/refreshToken.service";
import { EventRepository } from "./events/event.repository";
import { EventService } from "./events/services/event.service";
import { EventController } from "./events/controllers/event.controller";

export const userRepository = new UserRepository(AppDataSource);
export const eventRepository = new EventRepository(AppDataSource);

export const refreshTokenService = new RefreshTokenService();
export const userService = new UserService(userRepository);
export const authService = new AuthService(userRepository, refreshTokenService);

export const eventService = new EventService(eventRepository);

export const userController = new UserController(userService);
export const authController = new AuthController(authService);
export const eventController = new EventController(eventService);
