import { AppError } from "../utils/AppError";

export class NotAuthorizedError extends AppError {
  statusCode = 401;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
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
