// Midtrans Custom Error Classes

export class MidtransAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "MidtransAPIError";
  }
}

export class InvalidSignatureError extends Error {
  constructor(message: string = "Invalid webhook signature") {
    super(message);
    this.name = "InvalidSignatureError";
  }
}

export class TransactionNotFoundError extends Error {
  constructor(transactionId: string) {
    super(`Transaction not found: ${transactionId}`);
    this.name = "TransactionNotFoundError";
  }
}

export class MidtransConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MidtransConfigError";
  }
}
