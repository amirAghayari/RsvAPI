import crypto from "crypto";
import bcrypt from "bcryptjs";
import { DuplicateError } from "../../../src/errors/duplicate-error";
import { InternalServerError } from "../../../src/errors/internal-server-error";
import { NotAuthorizedError } from "../../../src/errors/not-authorized-error";
import { NotFoundError } from "../../../src/errors/not-found-error";
import { AuthService } from "../../../src/core/users/services/auth.service";
import { User } from "../../../src/core/users/user.entity";
import { UserRepository } from "../../../src/core/users/user.repository";
import { sendEmail } from "../../../src/utils/email";
import { verifyRefreshToken } from "../../../src/utils/jwt";

jest.mock("../../../src/utils/email", () => ({ sendEmail: jest.fn() }));
jest.mock("../../../src/utils/jwt", () => ({ verifyRefreshToken: jest.fn() }));

describe("AuthService", () => {
  const repository = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    findById: jest.fn(),
    saveUser: jest.fn(),
    findPasswordResetToken: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
  const service = new AuthService(repository);
  const mockedSendEmail = jest.mocked(sendEmail);
  const mockedVerifyRefreshToken = verifyRefreshToken as unknown as jest.Mock;
  const mockedCompare = jest.spyOn(bcrypt, "compare") as unknown as jest.Mock;

  const makeUser = (): User => {
    const user = new User();
    user.id = "user-1";
    user.email = "user@example.com";
    user.fullName = "Test User";
    user.role = "user";
    user.password = "hashed-password";
    user.refreshToken = "hashed-refresh-token";
    user.correctPassword = jest.fn();
    user.createPasswordResetToken = jest.fn();
    return user;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.FRONTEND_URL;
  });

  describe("signup", () => {
    it("creates a user when the email is unused", async () => {
      const createdUser = makeUser();
      repository.findByEmail.mockResolvedValue(null);
      repository.createUser.mockResolvedValue(createdUser);

      await expect(
        service.signup({
          email: "user@example.com",
          fullName: "Test User",
          password: "Password123!",
          passwordConfirmation: "Password123!",
        }),
      ).resolves.toBe(createdUser);

      expect(repository.createUser).toHaveBeenCalledWith({
        email: "user@example.com",
        fullName: "Test User",
        password: "Password123!",
      });
    });

    it("rejects duplicate emails", async () => {
      repository.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.signup({
          email: "user@example.com",
          fullName: "Test User",
          password: "Password123!",
          passwordConfirmation: "Password123!",
        }),
      ).rejects.toBeInstanceOf(DuplicateError);
      expect(repository.createUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns an authenticated user and requests password fields", async () => {
      const user = makeUser();
      jest.mocked(user.correctPassword).mockResolvedValue(true);
      repository.findByEmail.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: "Password123!" }),
      ).resolves.toBe(user);
      expect(repository.findByEmail).toHaveBeenCalledWith(user.email, {
        select: ["id", "fullName", "email", "role", "password", "avatar", "createdAt"],
      });
    });

    it("rejects an unknown email or invalid password", async () => {
      repository.findByEmail.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: "missing@example.com", password: "password" }),
      ).rejects.toBeInstanceOf(NotAuthorizedError);

      const user = makeUser();
      jest.mocked(user.correctPassword).mockResolvedValue(false);
      repository.findByEmail.mockResolvedValueOnce(user);
      await expect(
        service.login({ email: user.email, password: "wrong" }),
      ).rejects.toMatchObject({ message: "INCORRECT_PASSWORD" });
    });
  });

  describe("logout", () => {
    it("clears and saves the refresh token", async () => {
      const user = makeUser();
      repository.findById.mockResolvedValue(user);
      repository.saveUser.mockResolvedValue(user);

      await expect(service.logout(user.id)).resolves.toBeUndefined();
      expect(user.refreshToken).toBeNull();
      expect(repository.saveUser).toHaveBeenCalledWith(user);
    });

    it("rejects an unknown user", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.logout("missing")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("forgotPassword", () => {
    it("creates a reset token, saves it, and emails the development URL", async () => {
      const user = makeUser();
      (user.createPasswordResetToken as unknown as jest.Mock).mockReturnValue("plain-token");
      repository.findByEmail.mockResolvedValue(user);
      repository.saveUser.mockResolvedValue(user);

      await expect(service.forgotPassword({ email: user.email })).resolves.toBeUndefined();
      expect(repository.saveUser).toHaveBeenCalledWith(user);
      expect(mockedSendEmail).toHaveBeenCalledWith(
        user.email,
        "http://localhost:3000/reset-password/plain-token",
        "Request to reset password.",
      );
    });

    it("uses the production URL and clears reset fields when email delivery fails", async () => {
      process.env.NODE_ENV = "production";
      process.env.FRONTEND_URL = "app.example.com";
      const user = makeUser();
      user.passwordResetToken = "hashed-token";
      user.passwordResetExpires = new Date();
      (user.createPasswordResetToken as unknown as jest.Mock).mockReturnValue("plain-token");
      repository.findByEmail.mockResolvedValue(user);
      repository.saveUser.mockResolvedValue(user);
      mockedSendEmail.mockRejectedValue(new Error("mail failed"));

      await expect(service.forgotPassword({ email: user.email })).rejects.toBeInstanceOf(
        InternalServerError,
      );
      expect(mockedSendEmail).toHaveBeenCalledWith(
        user.email,
        "https://app.example.com/reset-password/plain-token",
        "Request to reset password.",
      );
      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetExpires).toBeNull();
      expect(repository.saveUser).toHaveBeenCalledTimes(2);
    });

    it("rejects an unknown email", async () => {
      repository.findByEmail.mockResolvedValue(null);
      await expect(
        service.forgotPassword({ email: "missing@example.com" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("refreshToken", () => {
    it("rejects missing, invalid, and mismatched refresh tokens", async () => {
      await expect(service.refreshToken("")).rejects.toBeInstanceOf(NotAuthorizedError);

      mockedVerifyRefreshToken.mockReturnValue({ userId: "user-1", role: "user" });
      repository.findById.mockResolvedValueOnce(null);
      await expect(service.refreshToken("token")).rejects.toBeInstanceOf(NotAuthorizedError);

      const user = makeUser();
      repository.findById.mockResolvedValueOnce(user);
      mockedCompare.mockResolvedValueOnce(false);
      await expect(service.refreshToken("token")).rejects.toBeInstanceOf(NotAuthorizedError);
    });

    it("returns the user for a verified matching refresh token", async () => {
      const user = makeUser();
      mockedVerifyRefreshToken.mockReturnValue({ userId: user.id, role: "user" });
      repository.findById.mockResolvedValue(user);
      mockedCompare.mockResolvedValueOnce(true);

      await expect(service.refreshToken("token")).resolves.toBe(user);
      expect(repository.findById).toHaveBeenCalledWith(user.id, {
        select: ["id", "email", "role", "refreshToken"],
      });
    });
  });

  describe("resetPassword", () => {
    it("updates a user found by the hashed token and clears reset fields", async () => {
      const user = makeUser();
      const resetToken = "plain-reset-token";
      repository.findPasswordResetToken.mockResolvedValue(user);
      repository.saveUser.mockResolvedValue(user);

      await expect(
        service.resetPassword(
          { password: "NewPassword123!", passwordConfirmation: "NewPassword123!" },
          resetToken,
        ),
      ).resolves.toBe(user);
      expect(repository.findPasswordResetToken).toHaveBeenCalledWith(
        crypto.createHash("sha256").update(resetToken).digest("hex"),
      );
      expect(user.password).toBe("NewPassword123!");
      expect(user.passwordConfirmation).toBe("NewPassword123!");
      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetExpires).toBeNull();
    });

    it("rejects an expired or invalid reset token", async () => {
      repository.findPasswordResetToken.mockResolvedValue(null);
      await expect(
        service.resetPassword(
          { password: "NewPassword123!", passwordConfirmation: "NewPassword123!" },
          "invalid-token",
        ),
      ).rejects.toBeInstanceOf(NotAuthorizedError);
    });
  });
});
