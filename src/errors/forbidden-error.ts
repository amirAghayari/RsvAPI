import { AppError } from "../utils/AppError";

export class ForbiddenError extends AppError {
  statusCode = 403;

  constructor(message: string) {
    super(message);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, ForbiddenError.prototype);
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
