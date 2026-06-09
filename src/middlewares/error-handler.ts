import { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // if the error is an instance of AppError,
  // then send the error with the status code and the serialized errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).send({
      status: "error",
      errors: err.serializeErrors(),
    });
  }

  // if the error is not an instance of AppError,
  // send a 500 error and log the error
  console.error(err);
  return res.status(500).send({
    status: "error",
    errors: [
      {
        field: null,
        message: "Something went wrong.",
      },
    ],
  });
};
