import { ForbiddenError } from "../../../errors/forbidden-error";
import { NotAuthorizedError } from "../../../errors/not-authorized-error";
import { NotFoundError } from "../../../errors/not-found-error";
import { UnprocessableEntityError } from "../../../errors/unprocessable-entity.error";
import { ICreateUserDto } from "../dtos/create-user.dto";
import { IUpdateCurrentUserPasswordDto } from "../dtos/update-currentuser-password.dto";
import { IUpdateCurrentUserInfoDto } from "../dtos/update-currentuser.dto";
import { IUpdateUserDto } from "../dtos/update-user.dto";
import { User } from "../user.entity";
import { UserRepository } from "../user.repository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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
      throw new NotFoundError("This page does not exist.");
    }

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
      throw new NotFoundError(`User with this id : ${email} not found.`);
    }

    return targetUser;
  }

  async getDailyCounts(startDate?: Date, endDate?: Date) {
    const { start, end } = this.normalizeDateRange(startDate, endDate);
    return this.userRepository.findCountByDay(end, start);
  }

  /******************************************************
   ************* @description POST HANDLERS *************
   ******************************************************/

  async createUser(createUserDto: ICreateUserDto): Promise<User> {
    const newUser = await this.userRepository.userCreate({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      photo: createUserDto.photo,
      password: createUserDto.password,
    });

    return newUser;
  }

  /*******************************************************
   ************* @description PATCH HANDLERS *************
   *******************************************************/

  async updateUser(
    userId: string,
    updateUserDto: IUpdateUserDto,
  ): Promise<User | null> {
    const targetUser = await this.findUserById(userId);
    if (!targetUser) {
      throw new NotFoundError("User with this id not found. ");
    }
    // if the user is admin, only main admin can update the user
    if (targetUser!.role === "admin") {
      throw new NotAuthorizedError(
        "You cannot update the admin account. Only the system administrator can do this.",
      );
    }

    const updateUser = await this.userRepository.userUpdate(
      userId,
      updateUserDto,
    );

    return updateUser;
  }

  async updateCurrentUserInfo(
    currentUser: User,
    updateUserDto: IUpdateCurrentUserInfoDto,
  ): Promise<User | null> {
    // if password or passwordConfirmation is provided, throw an error
    if (updateUserDto.password) {
      throw new UnprocessableEntityError(
        "You cannot update the password with this request",
      );
    }

    const updatedUser = await this.userRepository.userUpdate(currentUser.id, {
      fullName: updateUserDto.fullName ?? currentUser.fullName,
      email: updateUserDto.email ?? currentUser.email,
      photo: updateUserDto.photo ?? currentUser.photo,
    });

    return updatedUser;
  }

  async updateCurrentUserPassword(
    currentUser: User,
    updateCurrentUserPasswordDto: IUpdateCurrentUserPasswordDto,
  ): Promise<User | null> {
    // find the user, if not found, throw an error
    const targetUser = await this.findUserById(currentUser.id);

    if (!targetUser) {
      throw new NotFoundError(`User with id ${currentUser.id} not found.`);
    }

    // check if the password current is correct
    const correct = await targetUser!.correctPassword(
      updateCurrentUserPasswordDto.passwordCurrent,
    );
    if (!correct) {
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
    // TODO : check update password security
    targetUser.password = updateCurrentUserPasswordDto.password;
    targetUser.passwordConfirmation =
      updateCurrentUserPasswordDto.passwordConfirmation;

    await this.userRepository.saveUser(targetUser);

    return targetUser;
  }

  /*******************************************************
   ************* @description DELETE HANDLERS ************
   *******************************************************/

  async deleteUser(userId: string, currentUser: User): Promise<void> {
    // find the user, if not found, throw an error
    const targetUser = await this.findUserById(userId);

    // if the user is admin, only main admin can delete the user
    if (targetUser!.role === "admin" || currentUser.role === "admin") {
      throw new NotAuthorizedError(
        "You cannot delete the admin account. Only the system administrator can do this.",
      );
    }

    await this.userRepository.delete(userId);
  }

  async deleteCurrentUser(currentUser: User): Promise<void> {
    await this.userRepository.delete(currentUser.id);
  }
}
