export class AppError extends Error {
  constructor(message, statusCode, title, errors) {
    super(message);
    this.statusCode = statusCode;
    this.title = title;
    this.errors = errors;
  }
}

export class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400, "Request validation failed", errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, "Resource was not found");
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(
      message,
      409,
      "The request could not be completed due to a conflict with the current state of the resource."
    );
  }
}
