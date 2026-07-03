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
 *     description: Creates a new user account and returns the authenticated user with an access token.
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
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User password
 *                 example: StrongP@ssw0rd
 *               passwordConfirmation:
 *                 type: string
 *                 format: password
 *                 description: Must match the password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation failed.
 *       409:
 *         description: User already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User with this email already exists.
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
