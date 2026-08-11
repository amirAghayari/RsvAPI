import request from "supertest";
import app from "../../../src/app";
import { createUser, usersUrl } from "../../factories/user.factory";
import { authenticateAdmin } from "../../helpers/auth.helper";

describe("Admin user API", () => {
  describe("authorization", () => {
    it("rejects anonymous and non-admin requests", async () => {
      const anonymousResponse = await request(app).get(usersUrl);
      expect(anonymousResponse.status).toBe(401);

      const user = await createUser();
      const loginResponse = await request(app).post(`${usersUrl}/login`).send({
        email: user.email,
        password: "Password123",
      });

      const userResponse = await request(app)
        .get(usersUrl)
        .set(
          "Authorization",
          `Bearer ${loginResponse.headers["x-auth-token"]}`,
        );

      expect(userResponse.status).toBe(403);
      expect(userResponse.body.errors[0].message).toBe(
        "FORBIDDEN: Admin access required",
      );
    });
  });

  describe("user management", () => {
    it("lets an admin list, read, create, and update regular users", async () => {
      const { accessToken } = await authenticateAdmin();
      const existingUser = await createUser({ fullName: "Existing User" });

      const listResponse = await request(app)
        .get(usersUrl)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.status).toBe("success");
      expect(listResponse.body.data.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: existingUser.id,
            email: existingUser.email,
          }),
        ]),
      );

      const readResponse = await request(app)
        .get(`${usersUrl}/${existingUser.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.user).toEqual(
        expect.objectContaining({ id: existingUser.id }),
      );

      const email = `admin-created-${Date.now()}@test.com`;
      const createResponse = await request(app)
        .post(usersUrl)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          fullName: "Admin Created User",
          email,
          password: "Password123",
          passwordConfirmation: "Password123",
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.user).toEqual(
        expect.objectContaining({
          fullName: "Admin Created User",
          email,
          role: "user",
        }),
      );

      const createdUserId = createResponse.body.data.user.id;
      const updateResponse = await request(app)
        .patch(`${usersUrl}/${createdUserId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          fullName: "Updated By Admin",
          email,
          password: "NewPassword123",
          passwordConfirmation: "NewPassword123",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.user).toEqual(
        expect.objectContaining({
          id: createdUserId,
          fullName: "Updated By Admin",
        }),
      );
    });

    it("validates admin create requests and prevents changes to admin accounts", async () => {
      const { admin, accessToken } = await authenticateAdmin();

      const invalidCreateResponse = await request(app)
        .post(usersUrl)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ fullName: "Missing credentials", email: "invalid-email" });

      expect(invalidCreateResponse.status).toBe(400);
      expect(invalidCreateResponse.body.message).toBe("Validation failed");

      const updateAdminResponse = await request(app)
        .patch(`${usersUrl}/${admin.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          fullName: "Should Not Update",
          password: "NewPassword123",
          passwordConfirmation: "NewPassword123",
        });

      expect(updateAdminResponse.status).toBe(401);
      expect(updateAdminResponse.body.errors[0].message).toBe(
        "You cannot update the admin account. Only the system administrator can do this.",
      );
    });
  });
});
