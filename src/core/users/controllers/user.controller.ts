import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { ICreateUserDto } from "../dtos/create-user.dto";
import { IUpdateUserDto } from "../dtos/update-user.dto";
import { IUpdateCurrentUserInfoDto } from "../dtos/update-currentuser.dto";
import { IUpdateCurrentUserPasswordDto } from "../dtos/update-currentuser-password.dto";
import createSendTokenAndResponse from "../../../utils/createSendTokenAndResponse";

export class UserController {
  constructor(private readonly userService: UserService) {}

  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/
  async findAllUsers(req: Request, res: Response) {
    const { pagination, users } = await this.userService.getAllUsers(req.query);

    res.status(200).json({
      status: "success",
      results: users.length,
      pagination,
      data: { users },
    });
  }
  // TODO : check obj type
  async getDailyCounts(req: Request, res: Response): Promise<void | object> {
    const startDateStr = req.query.startDate
      ? String(req.query.startDate)
      : undefined;
    const endDateStr = req.query.endDate
      ? String(req.query.endDate)
      : undefined;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDateStr) {
      start = new Date(startDateStr);
      if (isNaN(start.getTime())) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid startDate format" });
      }
    }

    if (endDateStr) {
      end = new Date(endDateStr);
      if (isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid endDate format" });
      }
    }
    const results = await this.userService.getDailyCounts(start, end);

    res.status(200).json({
      status: "success",
      results: results.length,
      data: { results },
    });
  }

  async findUserById(req: Request, res: Response): Promise<void> {
    const user = await this.userService.findUserById(req.params.id as string);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const currentUser = req.user;
    res.status(200).json({
      status: "success",
      data: { user: currentUser },
    });
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createUser(req: Request, res: Response): Promise<void> {
    const user = await this.userService.createUser(req.body as ICreateUserDto);
    res.status(201).json({
      status: "success",
      data: { user },
    });
  }

  /*******************************************************
   ************* @description PATCH HANDLERS *************
   *******************************************************/

  async updateUser(req: Request, res: Response): Promise<void> {
    const user = await this.userService.updateUser(
      req.params.id as string,
      req.body as IUpdateUserDto,
    );
    res.status(200).json({
      status: "success",
      data: { user },
    });
  }

  async updateCurrentUserInfo(req: Request, res: Response): Promise<void> {
    const updatedUser = await this.userService.updateCurrentUserInfo(
      req.user,
      req.body as IUpdateCurrentUserInfoDto,
    );
    res.status(200).json({
      status: "success",
      data: { updatedUser },
    });
  }

  async updateCurrentUserPassword(req: Request, res: Response): Promise<void> {
    // update the password
    const updatedUser = await this.userService.updateCurrentUserPassword(
      req.user,
      req.body as IUpdateCurrentUserPasswordDto,
    );

    // send the response
    await createSendTokenAndResponse(updatedUser!, 200, res);
  }

  async uploadAvatar(req: Request, res: Response) {
    const user = await this.userService.uploadUserAvatar(
      req.user.id,
      req.file!,
    );

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }
  /********************************************************
   ************* @description DELETE HANDLERS *************
   *********************************************************/

  async deleteUser(req: Request, res: Response): Promise<void> {
    await this.userService.deleteUser(req.params.id as string, req.user);
    res.status(204).json({
      status: "success",
      data: null,
    });
  }

  async deleteCurrentUser(req: Request, res: Response): Promise<void> {
    await this.userService.deleteCurrentUser(req.user);
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
}
