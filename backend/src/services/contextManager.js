/**
 * Context Management Service for ModelMesh AI
 * Normalizes input whitespace, enforces size limits, and structures request context safely.
 */

import { validateQueryInput, validateContextInput, PayloadTooLargeError } from '../utils/validation.js';

export const MAX_QUERY_LENGTH = 10000;
export const MAX_CONTEXT_LENGTH = 5000;

/**
 * Normalizes whitespace in input text while preserving paragraph structure
 * @param {string} text 
 * @returns {string}
 */
export function normalizeWhitespace(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n') // Normalize Windows line endings
    .replace(/[ \t]+/g, ' ') // Collapse multiple spaces/tabs into a single space
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive blank lines to 2
    .trim();
}

/**
 * Processes query and optional context payload safely
 * @param {object} payload - { query, context, maxQueryLength, maxContextLength }
 * @returns {object}
 */
export function processContext(payload = {}) {
  const {
    query,
    context: rawContext,
    maxQueryLength = MAX_QUERY_LENGTH,
    maxContextLength = MAX_CONTEXT_LENGTH
  } = payload;

  // Validate raw input
  const validatedQuery = validateQueryInput(query);
  const validatedContext = validateContextInput(rawContext);

  const originalLength = validatedQuery.length;

  // Enforce Max Query Size Limit (Reject oversized payloads)
  if (originalLength > maxQueryLength) {
    throw new PayloadTooLargeError(
      `Query payload size (${originalLength} characters) exceeds maximum allowed limit of ${maxQueryLength} characters.`
    );
  }

  // Normalize query whitespace
  const normalizedQuery = normalizeWhitespace(validatedQuery);
  const normalizedLength = normalizedQuery.length;
  const isTruncated = false; // We do not silently clip query text unless requested

  // Process optional context
  let processedContext = null;
  let contextTruncated = false;

  if (validatedContext) {
    const contextString = JSON.stringify(validatedContext);
    if (contextString.length > maxContextLength) {
      throw new PayloadTooLargeError(
        `Optional context payload size (${contextString.length} characters) exceeds maximum allowed limit of ${maxContextLength} characters.`
      );
    }
    processedContext = validatedContext;
  }

  return {
    normalizedQuery,
    processedContext,
    metadata: {
      isTruncated,
      originalLength,
      normalizedLength,
      contextTruncated
    }
  };
}
