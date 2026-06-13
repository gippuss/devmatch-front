export class ApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export function isApiException(e: unknown): e is ApiException {
  return e instanceof ApiException
}
