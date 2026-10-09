/**
 * Privacy Filtering Service for ModelMesh AI
 * Deterministically detects and redacts emails, phone numbers, API keys, and secrets.
 * 
 * Known Limitations & False Positives:
 * 1. Regex pattern matching cannot guarantee 100% detection of all proprietary or obfuscated secrets.
 * 2. Formatted numbers (e.g. version strings, IP addresses, or sequence IDs) matching phone regex shapes may occasionally trigger false positives.
 * 3. High-entropy random strings without standard prefix formats (like sk-, ghp-, hf_) might require entropy analyzers in future phases.
 */

// Deterministic Regex Patterns
const PATTERNS = {
  // Email addresses (standard RFC 5322 approximation)
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

  // Phone numbers (e.g. +1-555-019-2834, (555) 000-0000, 555-123-4567, +44 20 7946 0958)
  PHONE: /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,

  // Known API Token Prefixes and Formats (OpenAI, Anthropic, GitHub, Hugging Face, AWS, JWT)
  API_KEY: /\b(sk-proj-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|hf_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g,

  // Explicit Secret Key Assignments in prose or code snippet context
  SECRET: /(?:secret_key|api_secret|private_key|password|bearer_token|auth_token|access_token)\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi
};

/**
 * Redacts sensitive PII and API keys from text deterministically
 * @param {string} text 
 * @returns {object}
 */
export function filterPrivacy(text) {
  if (!text || typeof text !== 'string') {
    return {
      redactedQuery: typeof text === 'string' ? text : '',
      hasRedactions: false,
      redactionCount: 0,
      summary: {
        emailCount: 0,
        phoneCount: 0,
        apiKeyCount: 0,
        secretCount: 0,
        totalRedactions: 0
      }
    };
  }

  let emailCount = 0;
  let phoneCount = 0;
  let apiKeyCount = 0;
  let secretCount = 0;

  // 1. Redact API Keys
  let currentText = text.replace(PATTERNS.API_KEY, () => {
    apiKeyCount++;
    return '[REDACTED_API_KEY]';
  });

  // 2. Redact Explicit Secret Assignments
  currentText = currentText.replace(PATTERNS.SECRET, (match, secretVal) => {
    secretCount++;
    return match.replace(secretVal, '[REDACTED_SECRET]');
  });

  // 3. Redact Emails
  currentText = currentText.replace(PATTERNS.EMAIL, () => {
    emailCount++;
    return '[REDACTED_EMAIL]';
  });

  // 4. Redact Phone Numbers
  currentText = currentText.replace(PATTERNS.PHONE, () => {
    phoneCount++;
    return '[REDACTED_PHONE]';
  });

  const totalRedactions = emailCount + phoneCount + apiKeyCount + secretCount;

  return {
    redactedQuery: currentText,
    hasRedactions: totalRedactions > 0,
    redactionCount: totalRedactions,
    summary: {
      emailCount,
      phoneCount,
      apiKeyCount,
      secretCount,
      totalRedactions
    }
  };
}

/**
 * Recursively redacts PII/secrets inside arbitrary objects or arrays
 * @param {any} value 
 * @param {object} counts 
 * @returns {any}
 */
function redactRecursive(value, counts) {
  if (typeof value === 'string') {
    const res = filterPrivacy(value);
    counts.emailCount += res.summary.emailCount;
    counts.phoneCount += res.summary.phoneCount;
    counts.apiKeyCount += res.summary.apiKeyCount;
    counts.secretCount += res.summary.secretCount;
    return res.redactedQuery;
  }
  if (Array.isArray(value)) {
    return value.map(item => redactRecursive(item, counts));
  }
  if (value && typeof value === 'object') {
    const redactedObj = {};
    for (const [k, v] of Object.entries(value)) {
      redactedObj[k] = redactRecursive(v, counts);
    }
    return redactedObj;
  }
  return value;
}

/**
 * Filters privacy across both query text and optional user context object
 * @param {string} queryText 
 * @param {object|null} userContext 
 * @returns {object}
 */
export function filterPrivacyContext(queryText, userContext = null) {
  const queryResult = filterPrivacy(queryText);

  const contextCounts = {
    emailCount: 0,
    phoneCount: 0,
    apiKeyCount: 0,
    secretCount: 0
  };

  let redactedContext = null;
  if (userContext) {
    redactedContext = redactRecursive(userContext, contextCounts);
  }

  const totalEmail = queryResult.summary.emailCount + contextCounts.emailCount;
  const totalPhone = queryResult.summary.phoneCount + contextCounts.phoneCount;
  const totalApiKey = queryResult.summary.apiKeyCount + contextCounts.apiKeyCount;
  const totalSecret = queryResult.summary.secretCount + contextCounts.secretCount;
  const totalRedactions = totalEmail + totalPhone + totalApiKey + totalSecret;

  return {
    redactedQuery: queryResult.redactedQuery,
    redactedContext,
    hasRedactions: totalRedactions > 0,
    redactionCount: totalRedactions,
    summary: {
      emailCount: totalEmail,
      phoneCount: totalPhone,
      apiKeyCount: totalApiKey,
      secretCount: totalSecret,
      totalRedactions
    }
  };
}
