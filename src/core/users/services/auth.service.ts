import { DuplicateError } from "../../../errors/duplicate-error";
import { InternalServerError } from "../../../errors/internal-server-error";
import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { NotFoundError } from "../../../errors/not-found-error";
import { sendEmail } from "../../../utils/email";
import { verifyRefreshToken } from "../../../utils/jwt";
import { ILoginDto } from "../dtos/login.dto";
import { IResetPasswordDto } from "../dtos/reset.password.dto";
import { ISignupDto } from "../dtos/signup.dto";
import { User } from "../user.entity";
import { UserRepository } from "../user.repository";
import crypto from "crypto";

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
        "avatar",
        "createdAt",
      ],
    });

    if (!authenticatedUser)
      throw new NotAuthorizedError("Incorrect email or password.");

    const valid = await authenticatedUser.correctPassword(password);
    if (!valid) throw new NotAuthorizedError("INCORRECT_PASSWORD");

    return authenticatedUser;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
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
      await sendEmail(user.email, url, "درخواست برای ریست کردن رمز عبور");
    } catch (err) {
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
      throw new NotAuthorizedError("Refresh token not provided");
    }

    // Verify refresh token
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

  async resetPassword(
    resetPasswordDto: IResetPasswordDto,
    resetToken: string,
  ): Promise<User> {
    // check if the reset token is valid, if not, throw an error
    const token = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await this.userRepository.findPasswordResetToken(token);
    if (!user) {
      throw new NotAuthorizedError("The token is invalid or expired!");
    }

    // update the user password and reset the password reset token
    user.password = resetPasswordDto.password;
    user.passwordConfirmation = resetPasswordDto.passwordConfirmation;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    const updatedUser = await this.userRepository.saveUser(user);

    return updatedUser;
  }
}
