import { DataSource, Repository, UpdateResult } from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { User } from "./user.entity";
import { ICreateUserDto } from "./dtos/create-user.dto";
import { IUpdateUserDto } from "./dtos/update-user.dto";
import { NotFoundError } from "../../errors/not-found-error";
import { IUpdateCurrentUserInfoDto } from "./dtos/update-currentuser.dto";
import { IUpdateCurrentUserPasswordDto } from "./dtos/update-currentuser-password.dto";

export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.manager);
  }

  async saveUser(user: User): Promise<User> {
    return this.manager.save(user);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any) {
    const features = new APIFeatures<User>(this, query);

    features.filter().search().sort().limitFields();

    const { pagination, total, skip } = await features.pagination();

    const users = await features.execute();

    return { pagination, skip, total, users };
  }

  async findById(
    userId: string,
    options?: {
      select?: (keyof User)[];
      relations?: string[];
    },
  ): Promise<User | null> {
    const { select, relations } = options || {};

    const queryOptions: any = {
      where: { id: userId },
    };

    if (select && select.length) queryOptions.select = select;
    if (relations && relations.length) queryOptions.relations = relations;

    const user = await this.findOne(queryOptions);

    return user;
  }

  async findByEmail(
    email: string,
    options?: {
      select?: (keyof User)[];
      relations?: string[];
    },
  ): Promise<User | null> {
    const { select, relations } = options || {};

    const queryOptions: any = {
      where: { email },
    };

    if (select && select.length) queryOptions.select = select;
    if (relations && relations.length) queryOptions.relations = relations;

    const user = await this.findOne(queryOptions);

    return user;
  }

  // TODO : password reset token

  /**************************************************************
   ************* @description AGGREGATE OPERATIONS **************
   **************************************************************/

  async findCountByDay(
    endDate: Date,
    startDate?: Date,
  ): Promise<{ count: number; date: Date }[]> {
    const query = this.createQueryBuilder("users")
      .select("DATE(user.createdAt) as date")
      .addSelect("COUNT(user.ic)", "count")
      .where("user.createdAt BETWEEN :start AND :end", {
        start: startDate,
        end: endDate,
      })
      .groupBy("DATE(user.createdAt)")
      .orderBy("date", "ASC");

    const result = await query.getRawMany();

    return result.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async userCreate(createUserDto: ICreateUserDto): Promise<User> {
    return this.create(createUserDto);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/

  async userUpdate(
    userId: string,
    payload:
      | IUpdateUserDto
      | IUpdateCurrentUserInfoDto
      | IUpdateCurrentUserPasswordDto,
  ): Promise<User | null> {
    const result: UpdateResult = await this.update(userId, payload);

    if (result.affected === 0) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }
    const updatedUser = await this.findById(userId);
    if (!updatedUser) {
      throw new NotFoundError(`User with id ${userId} not found after update`);
    }

    return updatedUser;
  }

  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/

  async deleteUser(
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    await this.remove(user);

    return {
      success: true,
      message: `User with id ${userId} deleted successfully`,
    };
  }
}
