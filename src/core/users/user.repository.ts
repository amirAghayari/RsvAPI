import AppDataSource from "../../config/dataSource";
import { User } from "./user.entity";

export const UserRepository = AppDataSource.getRepository(User).extend({
  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any): Promise<{
    pagination: any;
    skip: number;
    total: number;
    users: User;
  }> {},
});
