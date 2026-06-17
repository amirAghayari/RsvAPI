import { AppError } from "../utils/AppError";

export class DuplicateError extends AppError {
  statusCode = 409;
  private field: string | null;

  constructor(field: string | null = null, message?: string) {
    const defaultMessage = field
      ? `The ${field} has already been taken.`
      : "Duplicate entry found.";

    super(message || defaultMessage);
    this.field = field;

    Object.setPrototypeOf(this, DuplicateError.prototype);
  }

  serializeErrors = () => {
    return [
      {
        field: this.field,
        message: this.message,
      },
    ];
  };
}
