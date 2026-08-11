import { AppError } from "../utils/AppError";

export class NotFoundError extends AppError {
  statusCode = 404;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, NotFoundError.prototype);
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
