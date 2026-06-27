import { DuplicateError } from "../../../errors/duplicate-error";
import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import {
  AuthPayload,
  getRefreshTokenTTLSeconds,
  verifyRefreshToken,
} from "../../../utils/jwt";
import { ILoginDto } from "../dtos/login.dto";
import { ISignupDto } from "../dtos/signup.dto";
import { UserRepository } from "../user.repository";
import { RefreshTokenService } from "./refreshToken.service";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

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

    return this.userRepository.create({
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

    let decoded: AuthPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new NotAuthorizedError("Invalid refresh token");
    }

    const userId = decoded.userId;
    const user = await this.userRepository.findById(userId, {
      select: ["id", "email", "role", "fullName", "photo", "refreshToken"],
    });

    if (!user) {
      throw new NotAuthorizedError("User not found");
    }

    let isValid = await this.refreshTokenService.validateRefreshTokenInRedis(
      userId,
      refreshToken,
    );

    if (!isValid && user.refreshToken) {
      isValid = await this.refreshTokenService.validateRefreshTokenInDB(
        user,
        refreshToken,
      );

      if (isValid) {
        const ttl = getRefreshTokenTTLSeconds();
        await this.refreshTokenService.storeRefreshTokenInRedis(
          userId,
          refreshToken,
          ttl,
        );
        console.log(`♻️ Refresh token re-stored in Redis for user ${userId}`);
      }
    }

    if (!isValid) {
      throw new NotAuthorizedError("Refresh token expired or revoked");
    }
    return user;
  }

  /************************************************************
   ************* @description PATCH HANDLERS ******************
   ************************************************************/

  //  TODO : reset password
}
