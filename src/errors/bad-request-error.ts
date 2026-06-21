import { AppError } from "../utils/AppError";

export class BadRequestError extends AppError {
  statusCode = 400;

  constructor(message: string) {
    super(message);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors = () => {
    return [
      {
        field: null,
        message: this.message,
      },
    ];
  };
}
