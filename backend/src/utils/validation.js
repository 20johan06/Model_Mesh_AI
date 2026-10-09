/**
 * Request validation utilities for ModelMesh AI backend
 */

export class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

export class PayloadTooLargeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PayloadTooLargeError';
    this.statusCode = 413;
  }
}

/**
 * Validates incoming query payload
 * @param {any} query 
 * @returns {string}
 */
export function validateQueryInput(query) {
  if (query === undefined || query === null) {
    throw new ValidationError("Field 'query' is required and cannot be null or undefined.", 400);
  }

  if (typeof query !== 'string') {
    throw new ValidationError("Field 'query' must be a valid string.", 400);
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Field 'query' cannot be empty or whitespace-only.", 400);
  }

  return query;
}

/**
 * Validates optional context payload
 * @param {any} context 
 * @returns {object|null}
 */
export function validateContextInput(context) {
  if (!context) return null;

  if (typeof context !== 'object' || Array.isArray(context)) {
    throw new ValidationError("Optional field 'context' must be a JSON object.", 400);
  }

  return context;
}
