import { AppError } from "../utils/AppError";

export class InternalServerError extends AppError {
  statusCode = 500;

  constructor(message: string) {
    super(message);

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, InternalServerError.prototype);
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
