export class SpellbookError extends Error {
  public readonly name: string = 'SpellbookError';

  public readonly cause?: Error | Record<string, any>;

  constructor(message: string, cause?: Error | Record<string, any>) {
    super(message);
    this.cause = cause;
  }
}
