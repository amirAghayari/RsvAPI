import { User } from "../../src/core/users/user.entity";
import { TestDataSource } from "../helpers/database";

let userCounter = 0;

export async function createUser(data?: Partial<User>) {
  const repository = TestDataSource.getRepository(User);

  userCounter++;

  const user = repository.create({
    fullName: "Test User",
    email: `test-${Date.now()}-${userCounter}@test.com`,
    password: "Password123",
    role: "user",

    ...data,
  });

  return repository.save(user);
}
