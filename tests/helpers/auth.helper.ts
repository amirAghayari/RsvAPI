import { createUser } from "../factories/user.factory";
import request from "supertest";
import app from "../../src/app/index";

async function authRequest() {
  const user = await createUser();

  const res = await request(app).post("/api/V1/auth/login").send({
    email: user.email,
    password: "Password123",
  });

  if (res.statusCode !== 200)
    throw new Error(
      `Failed to authenticate user: ${res.statusCode} - ${res.text} $ ${JSON.stringify(res.body)}`,
    );

  return {
    user,
    accessToken: res.body.token,
  };
}

export default authRequest;
