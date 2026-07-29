import express from "express";

import { paymentController } from "..";

import { protect } from "../../middlewares/auth.middleware";
import { isAdmin } from "../../middlewares/admin.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { verifyPaymentSchema } from "../../schemas/payments-schema/verifyPayment.schema";
import { createPaymentSchema } from "../../schemas/payments-schema/createPayment.schema";
import { getPaymentByIdSchema } from "../../schemas/payments-schema/getPaymentById.schema";
import { deletePaymentSchema } from "../../schemas/payments-schema/deletePayment.schema";

const router = express.Router();

/******************************************************
 ************* ZARINPAL CALLBACK ***********************
 ******************************************************/

router.get(
  "/verify",
  validate(verifyPaymentSchema),
  paymentController.verifyPayment.bind(paymentController),
);

/******************************************************
 ************* AUTHENTICATED USERS *********************
 ******************************************************/

router.use(protect);

// My payments
router.get("/me", paymentController.getMyPayments.bind(paymentController));

// Create payment
router.post(
  "/",
  validate(createPaymentSchema),
  paymentController.createPayment.bind(paymentController),
);

/******************************************************
 ************* ADMIN ONLY ******************************
 ******************************************************/

router.use(isAdmin);

// Get all payments
router.get("/", paymentController.getAllPayments.bind(paymentController));

// Get payment by id
router.get(
  "/:id",
  validate(getPaymentByIdSchema),
  paymentController.getPaymentById.bind(paymentController),
);

// Delete payment
router.delete(
  "/:id",
  validate(deletePaymentSchema),
  paymentController.deletePayment.bind(paymentController),
);

export { router as paymentRouter };
