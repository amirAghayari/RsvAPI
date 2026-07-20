import { createUser } from "../factories/user.factory";
import request from "supertest";
import app from "../../src/app/index";

async function authRequest() {
  const user = await createUser();

  const res = await request(app).post("/api/auth/login").send({
    email: user.email,
    password: "Password123",
  });

  return {
    user,
    token: res.body.token,
  };
}
