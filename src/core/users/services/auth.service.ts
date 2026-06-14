import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { verifyRefreshToken } from "../../../utils/jwt";
import { ILoginDto } from "../dtos/login.dto";
import { ISignupDto } from "../dtos/signup.dto";
import { UserRepository } from "../user.repository";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**************************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/
  async signup(signupDto: ISignupDto) {
    const exitingUser = await this.userRepository.findByEmail(signupDto.email);

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

    const valid = await authenticatedUser.correctPassword(password);
    if (!valid) throw new NotAuthorizedError("INCORRECT_PASSWORD");

    return authenticatedUser;
  }

  // TODO : forgot password

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new NotAuthorizedError("Refresh token not provided");
    }

    const decoded = await verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new NotAuthorizedError("Refresh token has expired.");
    }

    return user;
  }

  /************************************************************
   ************* @description PATCH HANDLERS ******************
   ************************************************************/

  //  TODO : reset password
}
