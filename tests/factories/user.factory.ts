import { User } from "../../src/core/users/user.entity";
import { TestDataSource } from "../helpers/database";

export async function createUser(data?: Partial<User>) {
  const repository = TestDataSource.getRepository(User);
  // TODO : fix , update
  const user = repository.create({
    fullName: "Test User",
    email: `test${Date.now()}@test.com`,
    password: "Password123",
    role: "USER",
    ...data,
  });

  return repository.save(user);
}
