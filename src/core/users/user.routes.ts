import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { signupSchema } from "../../schemas/user-schema/sign.shema";

import { authController, userController } from "..";
import { protect } from "../../middlewares/auth.middleware";
import { updateMeSchema } from "../../schemas/user-schema/updateMe.schema";
import { updateMePasswordSchema } from "../../schemas/user-schema/updateMePassword.schema";
import { isAdmin } from "../../middlewares/admin.middleware";
import { createUserByAdminSchema } from "../../schemas/user-schema/createUserByAdmin.schema";
import { updateUserByAdminSchema } from "../../schemas/user-schema/updateUserByAdmin.schema";
import { loginSchema } from "../../schemas/user-schema/login.schema";

const router = express.Router();

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
