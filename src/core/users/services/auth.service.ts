import { DuplicateError } from "../../../errors/duplicate-error";
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
      throw new DuplicateError(
        "The user has already registered with this email.",
      );
    }

    // return this.userService.createUser(signupDto);

    return this.userRepository.createUser({
      email: signupDto.email,
      fullName: signupDto.fullName,
      password: signupDto.password,
    });
  }

  async login(loginDto: ILoginDto) {
    const { email, password } = loginDto;
    const authenticatedUser = await this.userRepository.findByEmail(email, {
      select: [
        "id",
        "fullName",
        "email",
        "role",
        "password",
        "photo",
        "createdAt",
      ],
    });

    if (!authenticatedUser)
      throw new NotAuthorizedError("Incorrect email or password.");

    const valid = await authenticatedUser.correctPassword(password);
    if (!valid) throw new NotAuthorizedError("INCORRECT_PASSWORD");

    return authenticatedUser;
  }

  // TODO : forgot password

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token from cookie or body
   * @returns New access token and refresh token
   */

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
