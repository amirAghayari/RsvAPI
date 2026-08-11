import request from "supertest";
import app from "../../../src/app";
import { createUser, usersUrl } from "../../factories/user.factory";

describe("Auth API", () => {
  describe("POST /api/V1/users/signup", () => {
    it("should create new user", async () => {
      const email = `newuser-${Date.now()}@test.com`;
      const res = await request(app)
        .post(usersUrl + "/signup")
        .send({
          email,
          password: "Password123",
          passwordConfirmation: "Password123",
          fullName: "Test User",
        });
      expect(res.status).toBe(201);

      expect(res.body.status).toBe("success");
      expect(res.body.data.user).toBeDefined();

      // access token is returned in header
      expect(res.headers["x-auth-token"]).toBeDefined();

      // refresh and jwt cookies should be created
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      const user = await createUser({
        email: "duplicate@test.com",
      });

      const res = await request(app)
        .post(usersUrl + "/signup")
        .send({
          email: user.email,
          password: "Password123",
          passwordConfirmation: "Password123",
          fullName: "Another User",
        });

      expect(res.status).toBe(409);
    });

    it("should reject invalid signup data", async () => {
      const res = await request(app)
        .post(usersUrl + "/signup")
        .send({
          email: "invalid-email",
          password: "123",
          passwordConfirmation: "456",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/V1/users/login", () => {
    it("should login user and return token", async () => {
      const user = await createUser();

      const res = await request(app).post(`${usersUrl}/login`).send({
        email: user.email,
        password: "Password123",
      });

      expect(res.status).toBe(200);

      expect(res.headers["x-auth-token"]).toBeDefined();

      expect(res.headers["set-cookie"]).toBeDefined();

      expect(res.body.status).toBe("success");
    });

    it("should reject wrong password", async () => {
      const user = await createUser();

      const res = await request(app).post(`${usersUrl}/login`).send({
        email: user.email,
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
    });

    it("should reject unknown email", async () => {
      const res = await request(app).post(`${usersUrl}/login`).send({
        email: "unknown@test.com",
        password: "Password123",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/V1/users/logout", () => {
    it("should logout authenticated user", async () => {
      const user = await createUser();

      const loginRes = await request(app).post(`${usersUrl}/login`).send({
        email: user.email,
        password: "Password123",
      });

      const accessToken = loginRes.headers["x-auth-token"];

      const res = await request(app)
        .post("/api/V1/users/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(204);

      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /api/V1/users/refresh-token", () => {
    it("should refresh access token", async () => {
      const user = await createUser();

      const loginRes = await request(app).post(`${usersUrl}/login`).send({
        email: user.email,
        password: "Password123",
      });

      const cookies = loginRes.headers["set-cookie"];

      expect(cookies).toBeDefined();

      const res = await request(app)
        .post("/api/V1/users/refresh-token")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);

      expect(res.headers["x-auth-token"]).toBeDefined();
    });
  });
});
