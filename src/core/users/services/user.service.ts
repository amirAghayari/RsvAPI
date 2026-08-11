import { ForbiddenError } from "../../../errors/forbidden-error";
import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { NotFoundError } from "../../../errors/not-found-error";
import { UnprocessableEntityError } from "../../../errors/unprocessable-entity.error";
import { CloudinaryService } from "../../cloudinary/services/cloudinary.service";
import { ICreateUserDto } from "../dtos/create-user.dto";
import { IUpdateCurrentUserPasswordDto } from "../dtos/update-currentuser-password.dto";
import { IUpdateCurrentUserInfoDto } from "../dtos/update-currentuser.dto";
import { IUpdateUserDto } from "../dtos/update-user.dto";
import { User } from "../user.entity";
import { UserRepository } from "../user.repository";
import cloudinary from "../../../config/cloudinary";
import { logger } from "../../../logger/logger";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private normalizeDateRange(start?: Date, end?: Date) {
    const normalizedEnd = end ? new Date(end) : new Date();
    normalizedEnd.setHours(23, 59, 59, 999);

    const normalizedStart = start ? new Date(start) : new Date("1970-01-01");
    normalizedStart.setHours(0, 0, 0, 0);

    return { start: normalizedStart, end: normalizedEnd };
  }
  /******************************************************
   ************* @description GET HANDLERS *************
   ******************************************************/

  async getAllUsers(query: any): Promise<{ pagination: any; users: User[] }> {
    const { pagination, skip, total, users } =
      await this.userRepository.findAll(query);

    if (query.page && skip >= total) {
      logger.warn(
        {
          requestedPage: query.page,
          totalUsers: total,
        },
        "Invalid user pagination page requested",
      );

      throw new NotFoundError("This page does not exist.");
    }

    logger.info(
      {
        count: users.length,
      },
      "Users fetched successfully",
    );

    return { pagination, users };
  }

  async findUserById(
    userId: string,
    options?: {
      select?: (keyof User)[];
      relations?: string[];
    },
  ): Promise<User | null> {
    const targetUser = await this.userRepository.findById(userId, options);

    if (!targetUser) {
      logger.warn(
        {
          userId,
        },
        "User not found by id",
      );

      throw new NotFoundError(`User with this id : ${userId} not found.`);
    }

    return targetUser;
  }

  async findUserByEmail(
    email: string,
    options?: {
      select?: (keyof User)[];
      relations?: string[];
    },
  ): Promise<User | null> {
    const targetUser = await this.userRepository.findByEmail(email, options);

    if (!targetUser) {
      logger.warn(
        {
          email,
        },
        "User not found by email",
      );

      throw new NotFoundError(`User with this id : ${email} not found.`);
    }

    return targetUser;
  }

  async getDailyCounts(startDate?: Date, endDate?: Date) {
    const { start, end } = this.normalizeDateRange(startDate, endDate);

    logger.debug(
      {
        start,
        end,
      },
      "Fetching daily user counts",
    );

    return this.userRepository.findCountByDay(end, start);
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createUser(createUserDto: ICreateUserDto): Promise<User> {
    const newUser = await this.userRepository.createUser({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: createUserDto.password,
    });

    logger.info(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      "User created successfully",
    );

    return newUser;
  }

  /*******************************************************
   ************* @description PATCH HANDLERS *************
   *******************************************************/

  async updateUser(
    userId: string,
    updateUserDto: IUpdateUserDto,
  ): Promise<User | null> {
    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      logger.warn(
        {
          userId,
        },
        "User update failed because user not found",
      );

      throw new NotFoundError("User with this id not found. ");
    }
    // if the user is admin, only main admin can update the user

    if (targetUser.role === "admin") {
      logger.warn(
        {
          userId,
        },
        "Unauthorized attempt to update admin account",
      );

      throw new NotAuthorizedError(
        "You cannot update the admin account. Only the system administrator can do this.",
      );
    }

    targetUser.fullName = updateUserDto.fullName ?? targetUser.fullName;
    targetUser.email = updateUserDto.email ?? targetUser.email;
    targetUser.avatar = updateUserDto.avatar ?? targetUser.avatar;

    if (updateUserDto.password) {
      targetUser.password = updateUserDto.password;
    }

    const updatedUser = await this.userRepository.saveUser(targetUser);

    logger.info(
      {
        userId,
      },
      "User updated successfully",
    );

    return updatedUser;
  }

  async updateCurrentUserInfo(
    currentUser: User,
    updateUserDto: IUpdateCurrentUserInfoDto,
  ): Promise<User | null> {
    // if password or passwordConfirmation is provided, throw an error
    if (updateUserDto.password) {
      logger.warn(
        {
          userId: currentUser.id,
        },
        "Attempt to update password through profile update endpoint",
      );

      throw new UnprocessableEntityError(
        "You cannot update the password with this request",
      );
    }

    const updatedUser = await this.userRepository.userUpdate(currentUser.id, {
      fullName: updateUserDto.fullName ?? currentUser.fullName,
      email: updateUserDto.email ?? currentUser.email,
      avatar: updateUserDto.avatar ?? currentUser.avatar,
    });

    logger.info(
      {
        userId: currentUser.id,
      },
      "Current user information updated",
    );

    return updatedUser;
  }

  async updateCurrentUserPassword(
    currentUser: User,
    updateCurrentUserPasswordDto: IUpdateCurrentUserPasswordDto,
  ): Promise<User | null> {
    // find the user, if not found, throw an error
    const targetUser = await this.userRepository.findById(currentUser.id, {
      select: ["id", "password"],
    });

    if (!targetUser) {
      logger.warn(
        {
          userId: currentUser.id,
        },
        "Password update failed because user not found",
      );

      throw new NotFoundError(`User with id ${currentUser.id} not found.`);
    }

    // check if the password current is correct
    const correct = await targetUser.correctPassword(
      updateCurrentUserPasswordDto.currentPassword,
    );

    if (!correct) {
      logger.warn(
        {
          userId: currentUser.id,
        },
        "Password update failed because current password is incorrect",
      );

      throw new ForbiddenError("Your current password is incorrect.");
    }

    if (
      updateCurrentUserPasswordDto.password !==
      updateCurrentUserPasswordDto.passwordConfirmation
    ) {
      throw new UnprocessableEntityError(
        "New password and confirm password do not match",
      );
    }

    targetUser.password = updateCurrentUserPasswordDto.password;
    targetUser.passwordConfirmation =
      updateCurrentUserPasswordDto.passwordConfirmation;

    await this.userRepository.saveUser(targetUser);

    logger.info(
      {
        userId: currentUser.id,
      },
      "User password updated successfully",
    );

    return this.userRepository.findById(currentUser.id);
  }

  async uploadUserAvatar(userId: string, file: Express.Multer.File) {
    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      logger.warn(
        {
          userId,
        },
        "Avatar upload failed because user not found",
      );

      throw new NotFoundError(`User with id ${userId} not found.`);
    }

    if (targetUser.avatarPublicId) {
      await cloudinary.uploader.destroy(targetUser.avatarPublicId);
    }

    const result = await this.cloudinaryService.upload(file.buffer);

    await this.userRepository.userUpdate(userId, {
      avatar: result.secure_url,
      avatarPublicId: result.public_id,
    });

  /*******************************************************
   ************* @description DELETE HANDLERS ************
   *******************************************************/
    logger.info(
      {
        userId,
      },
      "User avatar uploaded successfully",
    );
  }

  async deleteUser(userId: string, currentUser: User): Promise<void> {
    // find the user, if not found, throw an error
    const targetUser = await this.findUserById(userId);

    // if the user is admin, only main admin can delete the user
    if (targetUser!.role === "admin" || currentUser.role === "admin") {
      logger.warn(
        {
          targetUserId: userId,
          requesterId: currentUser.id,
        },
        "Unauthorized attempt to delete admin account",
      );

      throw new NotAuthorizedError(
        "You cannot delete the admin account. Only the system administrator can do this.",
      );
    }

    await this.userRepository.deleteUser(userId);

    logger.info(
      {
        deletedUserId: userId,
        requesterId: currentUser.id,
      },
      "User deleted successfully",
    );
  }

  async deleteCurrentUser(currentUser: User): Promise<void> {
    await this.userRepository.deleteUser(currentUser.id);

    logger.info(
      {
        userId: currentUser.id,
      },
      "Current user deleted account",
    );
  }
}
