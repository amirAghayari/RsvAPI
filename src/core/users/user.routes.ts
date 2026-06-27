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

const router = express.Router();
/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: New user registration
 *     description: This endpoint is used to create a new user account. It receives the user information and after validation, returns an authentication token.
 *     tags:
 *       - Authentication
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
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "john doe"
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "StrongP@ssw0rd"
 *                 description: Password (minimum 8 characters)
 *               passwordConfirmation:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "StrongP@ssw0rd"
 *                 description: Must match the password field
 *     responses:
 *       201:
 *         description: کاربر با موفقیت ایجاد شد
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     fullName:
 *                       type: string
 *                       example: "john doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *       400:
 *         description: داده‌های ورودی نامعتبر (خطای اعتبارسنجی)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation failed: email must be a valid email"
 *       409:
 *         description: کاربر قبلاً با این ایمیل یا نام کاربری ثبت شده است
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *       500:
 *         description: خطای داخلی سرور
 */
router.post("/signup", [
  validate(signupSchema),
  authController.signup.bind(authController),
]);

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
