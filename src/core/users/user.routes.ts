import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { signupSchema } from "../../schemas/users-schema/sign.shema";

import { authController, userController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { updateMeSchema } from "../../schemas/users-schema/updateMe.schema";
import { updateMePasswordSchema } from "../../schemas/users-schema/updateMePassword.schema";
import { isAdmin } from "../../middlewares/admin.middleware";
import { createUserByAdminSchema } from "../../schemas/users-schema/createUserByAdmin.schema";
import { updateUserByAdminSchema } from "../../schemas/users-schema/updateUserByAdmin.schema";
import { loginSchema } from "../../schemas/users-schema/login.schema";
import { upload } from "../../middlewares/upload.middleware";
import { forgotPasswordSchema } from "../../schemas/users-schema/forgotPassword.schema";
import { resetPasswordSchema } from "../../schemas/users-schema/resetPassword.schema";

const router = express.Router();
/**
 * @swagger
 * /users/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account and returns access token data for the newly registered user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - passwordConfirmation
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *               passwordConfirmation:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       201:
 *         description: User registration completed successfully.
 *       400:
 *         description: Validation or bad request.
 *       409:
 *         description: User already exists.
 */
/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticates a user account using email and password and returns a bearer token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Login successful.
 *       401:
 *         description: Invalid credentials.
 */
/**
 * @swagger
 * /users/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout current user
 *     description: Logs out the authenticated user from the current session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful.
 *       401:
 *         description: Unauthorized.
 */
/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *       401:
 *         description: Invalid or expired refresh token.
 */
/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Sends a password reset email to the provided user email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset email sent.
 *       404:
 *         description: User not found.
 */
/**
 * @swagger
 * /users/reset-password:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Reset password with token
 *     description: Resets the user's password using the token received in the reset email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirmation
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewStrongP@ssw0rd
 *               passwordConfirmation:
 *                 type: string
 *                 format: password
 *                 example: NewStrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Password reset successful.
 *       401:
 *         description: Invalid token.
 */
/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current authenticated user
 *     description: Returns the current logged-in user's profile.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user fetched successfully.
 *   patch:
 *     tags:
 *       - User
 *     summary: Update current user profile
 *     description: Updates the current authenticated user's profile information.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete current user account
 *     description: Deletes the authenticated user's own account.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User deleted successfully.
 */
/**
 * @swagger
 * /users/me/update-password:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update current user password
 *     description: Changes the authenticated user's password and returns a new token in the response.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - newPasswordConfirmation
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongP@ssw0rd
 *               newPasswordConfirmation:
 *                 type: string
 *                 format: password
 *                 example: NewStrongP@ssw0rd
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       401:
 *         description: Unauthorized.
 */
/**
 * @swagger
 * /users/avatar:
 *   patch:
 *     tags:
 *       - User
 *     summary: Upload avatar
 *     description: Uploads an avatar image for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully.
 */
/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users
 *     description: Returns paginated user records for administrators only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list fetched successfully.
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create user by admin
 *     description: Creates a user from the admin panel.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created successfully.
 */
/**
 * @swagger
 * /users/get-daily-users-count:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get daily user registration count
 *     description: Returns daily user counts for admin analytics.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics returned successfully.
 */
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user by id
 *     description: Returns a single user record for admin access.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User fetched successfully.
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user by admin
 *     description: Updates a user's information from the admin perspective.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User updated successfully.
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user by admin
 *     description: Deletes a user account from the admin panel.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User deleted successfully.
 */
router.post(
  "/signup",
  validate(signupSchema),
  authController.signup.bind(authController),
);

router.post("/login", [
  validate(loginSchema),
  authController.login.bind(authController),
]);

router.post("/logout", authController.logout.bind(authController));

router.post("/refresh-token", authController.refreshToken.bind(authController));

/************************************************************************
 *********  @description Protect all routes below to users only *********
 ************************************************************************/
router.use(protect);

router.post("/forgot-password", [
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
]);

router.patch("/reset-password", [
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
]);

router
  .route("/me")
  .get(userController.getCurrentUser.bind(userController))
  .patch([
    validate(updateMeSchema),
    userController.updateCurrentUserInfo.bind(userController),
  ])
  .delete(userController.deleteCurrentUser.bind(userController));

router.patch("/me/update-password", [
  validate(updateMePasswordSchema),
  userController.updateCurrentUserPassword.bind(userController),
]);

router.patch(
  "/avatar",
  upload.single("avatar"),
  userController.uploadAvatar.bind(userController),
);

/************************************************************************
 *********  @description Restrict all routes below to admin only *********
 ************************************************************************/

router.use(isAdmin);

router
  .route("/")
  .get(userController.findAllUsers.bind(userController))
  .post([
    validate(createUserByAdminSchema),
    userController.createUser.bind(userController),
  ]);

router
  .route("/get-daily-users-count")
  .get(userController.getDailyCounts.bind(userController));

router
  .route("/:id")
  .get([userController.findUserById.bind(userController)])
  .delete([userController.deleteUser.bind(userController)])
  .patch([
    validate(updateUserByAdminSchema),
    userController.updateUser.bind(userController),
  ]);

export { router as userRouter };
