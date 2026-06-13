import express from "express";
import { validate } from "../../middlewares/validate.middleware";
import { signupSchema } from "../../schemas/user-schema/sign.shema";

const router = express.Router();
// TODO : update user routes

router.post(
  "/signup",
  validate(signupSchema),
  // authController.signup.bind(authController),
);
