import { AppError } from "../utils/AppError";

export class UnprocessableEntityError extends AppError {
  statusCode = 422;

  constructor(public override message: string) {
    super(message);

    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
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
