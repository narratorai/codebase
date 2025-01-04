/**
 * Custom error class for Mavis API errors.
 */
export class APIError extends Error {
  status: number
  code: string
  description: string[]

  constructor(status: number, code: string, message: string, description: string[]) {
    super(message)

    this.status = status
    this.code = code
    this.description = description
  }
}
