import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ISignupDto } from "../dtos/signup.dto";
import createSendTokenAndResponse from "../../../utils/createSendTokenAndResponse";
import { ILoginDto } from "../dtos/login.dto";
import { User } from "../user.entity";
import AppDataSource from "../../../config/dataSource";
import { IResetPasswordDto } from "../dtos/reset.password.dto";
import { IForgotPasswordDto } from "../dtos/forgot.password.dto";

export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /************************************************************
   ************* @description POST HANDLERS *******************
   ***********************************************************/
  async signup(req: Request, res: Response): Promise<void> {
    const user = await this.authService.signup(req.body as ISignupDto);
    createSendTokenAndResponse(user, 201, res);
  }

  async login(req: Request, res: Response): Promise<void> {
    const user = await this.authService.login(req.body as ILoginDto);
    createSendTokenAndResponse(user, 200, res);
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (req.user && req.user instanceof User) {
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.update(req.user.id, {
        refreshToken: null,
      });
    }

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("jwt", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });
    res.cookie("refreshToken", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });

    res.status(204).setHeader("x-auth-token", "").end();
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    // Send email to user with reset password link,
    // if the email is not sent, throw error
    await this.authService.forgotPassword(req.body as IForgotPasswordDto);

    res.status(200).json({
      status: "success",
      message: "Password recovery email sent successfully",
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const user = await this.authService.refreshToken(req.cookies.refreshToken);
    createSendTokenAndResponse(user, 200, res);
  }

  /************************************************************
   ************* @description PATCH HANDLERS ******************
   ************************************************************/

  async resetPassword(req: Request, res: Response): Promise<void> {
    const user = await this.authService.resetPassword(
      req.body as IResetPasswordDto,
      req.query.resetToken as string,
    );
    createSendTokenAndResponse(user, 200, res);
  }
}
