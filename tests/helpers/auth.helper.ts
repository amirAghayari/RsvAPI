import app from "../../src/app";
import { createUser } from "../factories/user.factory";
import request from "supertest";

const usersUrl = "/api/V1/users";

export async function authRequest() {
  const user = await createUser();

  const res = await request(app).post(`${usersUrl}/login`).send({
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

export async function authenticateAdmin() {
  const admin = await createUser({ role: "admin" });
  const response = await request(app).post(`${usersUrl}/login`).send({
    email: admin.email,
    password: "Password123",
  });

  expect(response.status).toBe(200);

  return { admin, accessToken: response.headers["x-auth-token"] as string };
}
