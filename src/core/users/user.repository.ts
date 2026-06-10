import { DataSource, Repository } from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { User } from "./user.entity";

export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.manager);
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
      where: { userId },
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
}
