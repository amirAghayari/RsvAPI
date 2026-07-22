import request from "supertest";
import app from "../../src/app";
import authRequest from "../helpers/auth.helper";

describe("User API", () => {
  describe("Get /api/V1/users/me", () => {
    it("should return current user", async () => {
      const user = await authRequest();

      const res = await request(app)
        .get("/api/V1/users/me")
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(user.user.email);
    });
  });

  describe("PATCH /api/V1/users/me", () => {
    it("should update current user info", async () => {
      const user = await authRequest();

      const res = await request(app)
        .patch("/api/V1/users/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          fullName: "UpdatedFirstName",
          email: `updated-${Date.now()}@test.com`,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.updatedUser.fullName).toBe("UpdatedFirstName");
      expect(res.body.data.updatedUser.email).toBeDefined();
    });

    // for validations
    it("should return 400 if provided data is invalid", async () => {
      const user = await authRequest();

      const res = await request(app)
        .patch("/api/V1/users/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          fullName: 121,
          email: "wrongEmailFormat",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("PATCH /api/V1/users/me/update-password", () => {
    it("should return 200 if password is updated successfully", async () => {
      const user = await authRequest();

      const res = await request(app)
        .patch("/api/V1/users/me/update-password")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          currentPassword: "Password123",
          password: "newPassword123",
          passwordConfirmation: "newPassword123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.headers["x-auth-token"]).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it("should return 403 if current password is wrong", async () => {
      const user = await authRequest();
      const res = await request(app)
        .patch("/api/V1/users/me/update-password")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          currentPassword: "wrongPassword",
          password: "newPassword123",
          passwordConfirmation: "newPassword123",
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 403 if password and passwordConfirmation do not match", async () => {
      const user = await authRequest();
      const res = await request(app)
        .patch("/api/V1/users/me/update-password")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          currentPassword: "Password123",
          password: "newPassword123",
          passwordConfirmation: "notMatchPassword",
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("DELETE /api/V1/users/me", () => {
    it("should return 204 if user deleted successfully ", async () => {
      const user = await authRequest();
      const res = await request(app)
        .delete("/api/V1/users/me")
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.statusCode).toBe(204);
    });
  });
});
