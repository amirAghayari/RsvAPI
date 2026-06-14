import { UserRepository } from "./users/user.repository";
import AppDataSource from "../config/dataSource";
import { UserService } from "./users/services/user.service";
import { AuthService } from "./users/services/auth.service";
import { UserController } from "./users/controllers/user.controller";
import { AuthController } from "./users/controllers/auth.controller";

export const userRepository = new UserRepository(AppDataSource);

export const userService = new UserService(userRepository);
export const authService = new AuthService(userRepository);

export const userController = new UserController(userService);
export const authController = new AuthController(authService);
