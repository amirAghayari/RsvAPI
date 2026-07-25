import app from "../../src/app";
import { createUser } from "../factories/user.factory";
import request from "supertest";

async function authRequest() {
  const user = await createUser();

  const res = await request(app).post("/api/V1/users/login").send({
    email: user.email,
    password: "Password123",
  });

  if (res.statusCode !== 200) {
    throw new Error(
      `Failed to authenticate user: ${res.statusCode} - ${res.text}`,
    );
  }

  // 1. Safely extract and ensure it is treated as an array
  const cookies = res.headers["set-cookie"] || [];
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

  // 2. Map and join safely
  const cookieHeader = cookieArray
    .map((cookie: string) => cookie.split(";")[0])
    .join("; ");

  return {
    user,
    accessToken: res.headers["x-auth-token"],
    cookies: cookieHeader,
  };
}

export default authRequest;
