import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { ILoginDto } from "../dtos/login.dto";
import { ISignupDto } from "../dtos/signup.dto";
import { UserRepository } from "../user.repository";
import { UserService } from "./user.service";
import bcrypt from "bcryptjs";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  /**************************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/
  async signup(signupDto: ISignupDto) {
    const exitingUser = await this.userService.findUserByEmail(signupDto.email);

    if (exitingUser) {
      throw new Error("The user has already registered with this email.");
    }

    // return this.userService.createUser(signupDto);

    return this.userRepository.create({
      email: signupDto.email,
      name: signupDto.name,
      password: signupDto.password,
    });
  }

  async login(loginDto: ILoginDto) {
    const { email, password } = loginDto;
    const authenticatedUser = await this.userRepository.findByEmail(email);

    if (!authenticatedUser)
      throw new NotAuthorizedError("Incorrect email or password.");

    const valid = await bcrypt.compare(password, authenticatedUser.password);
    if (!valid) throw new NotAuthorizedError("INCORRECT_PASSWORD");

    return authenticatedUser;
  }
}
