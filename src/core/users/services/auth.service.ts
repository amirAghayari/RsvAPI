import { DuplicateError } from "../../../errors/duplicate-error";
import { InternalServerError } from "../../../errors/internal-server-error";
import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { NotFoundError } from "../../../errors/not-found-error";
import { sendEmail } from "../../../utils/email";
import { verifyRefreshToken } from "../../../utils/jwt";
import { IForgotPasswordDto } from "../dtos/forgot.password.dto";
import { ILoginDto } from "../dtos/login.dto";
import { IResetPasswordDto } from "../dtos/reset.password.dto";
import { ISignupDto } from "../dtos/signup.dto";
import { User } from "../user.entity";
import { UserRepository } from "../user.repository";
import { logger } from "../../../shared/logger";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**************************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/
  async signup(signupDto: ISignupDto) {
    const exitingUser = await this.userRepository.findByEmail(signupDto.email);

    if (exitingUser) {
      logger.warn(
        {
          email: signupDto.email,
        },
        "Signup failed because email already exists",
      );

      throw new DuplicateError(
        "The user has already registered with this email.",
      );
    }

    const user = await this.userRepository.createUser({
      email: signupDto.email,
      fullName: signupDto.fullName,
      password: signupDto.password,
    });

    logger.info(
      {
        userId: user.id,
        email: user.email,
      },
      "User registered successfully",
    );

    return user;
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
        "avatar",
        "createdAt",
      ],
    });

    if (!authenticatedUser) {
      logger.warn(
        {
          email,
        },
        "Login failed because user was not found",
      );

      throw new NotAuthorizedError("Incorrect email or password.");
    }

    const valid = await authenticatedUser.correctPassword(password);

    if (!valid) {
      logger.warn(
        {
          userId: authenticatedUser.id,
          email,
        },
        "Login failed because password was incorrect",
      );

      throw new NotAuthorizedError("INCORRECT_PASSWORD");
    }

    logger.info(
      {
        userId: authenticatedUser.id,
        email,
      },
      "User logged in successfully",
    );

    return authenticatedUser;
  }

  async logout(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      logger.warn(
        {
          userId,
        },
        "Logout failed because user not found",
      );

      throw new NotFoundError("User with this not found.");
    }

    user.refreshToken = null;

    await this.userRepository.saveUser(user);

    logger.info(
      {
        userId,
      },
      "User logged out successfully",
    );
  }

  async forgotPassword(forgotPasswordDto: IForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(forgotPasswordDto.email);

    if (!user) {
      logger.warn(
        {
          email: forgotPasswordDto.email,
        },
        "Forgot password requested for unknown user",
      );

      throw new NotFoundError("User with this not found.");
    }
    // create a password reset token

    const resetToken = user.createPasswordResetToken();

    await this.userRepository.saveUser(user);

    // send email with the password reset token
    let url = `http://localhost:3000/reset-password/${resetToken}`;

    if (process.env.NODE_ENV === "production") {
      url = `https://${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    }

    try {
      await sendEmail(user.email, url, "Request to reset password.");

      logger.info(
        {
          userId: user.id,
          email: user.email,
        },
        "Password reset email sent successfully",
      );
    } catch (err) {
      logger.error(
        {
          err,
          userId: user.id,
        },
        "Failed to send password reset email",
      );

      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await this.userRepository.saveUser(user);

      throw new InternalServerError(
        "There was an error sending the email. Please try again later.",
      );
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      logger.warn({}, "Refresh token request without token");

      throw new NotAuthorizedError("Refresh token not provided");
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findById(decoded.userId, {
      select: ["id", "email", "role", "refreshToken"],
    });

    if (!user || !user.refreshToken) {
      logger.warn(
        {
          userId: decoded.userId,
        },
        "Invalid refresh token because user token not found",
      );

      throw new NotAuthorizedError("Invalid refresh token.");
    }

    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isValidRefreshToken) {
      logger.warn(
        {
          userId: user.id,
        },
        "Invalid refresh token",
      );

      throw new NotAuthorizedError("Invalid refresh token.");
    }

    logger.info(
      {
        userId: user.id,
      },
      "Refresh token validated successfully",
    );

    return user;
  }
  /************************************************************
   ************* @description PATCH HANDLERS ******************
   ************************************************************/

  async resetPassword(
    resetPasswordDto: IResetPasswordDto,
    resetToken: string,
  ): Promise<User> {
    const token = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await this.userRepository.findPasswordResetToken(token);

    if (!user) {
      logger.warn(
        {},
        "Password reset failed because token was invalid or expired",
      );

      throw new NotAuthorizedError("The token is invalid or expired!");
    }

    user.password = resetPasswordDto.password;
    user.passwordConfirmation = resetPasswordDto.passwordConfirmation;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    const updatedUser = await this.userRepository.saveUser(user);

    logger.info(
      {
        userId: updatedUser.id,
      },
      "Password reset successfully",
    );

    return updatedUser;
  }
}
