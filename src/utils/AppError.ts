export abstract class AppError extends Error {
  constructor(message: string) {
    super(message);

    // because we are extending a built-in class
    Object.setPrototypeOf(this, AppError.prototype);
  }

  abstract statusCode: number;
  abstract serializeErrors: () => {
    field: string | null;
    message: string;
  }[];
}
