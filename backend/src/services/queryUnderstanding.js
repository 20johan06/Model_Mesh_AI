/**
 * Deterministic Query Understanding Service for ModelMesh AI
 * Analyzes query structure, domain keywords, complexity, intent, and constraints.
 */

/**
 * Analyzes query text and returns structured classification metadata
 * @param {string} query 
 * @returns {object}
 */
export function analyzeQuery(query) {
  const text = query || '';
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = text.length;

  // Keyword / Pattern sets for task classification
  const codePatterns = [
    'function', 'class', 'import', 'def ', 'const ', 'let ', 'var ', 'return ',
    'async', 'await', 'python', 'javascript', 'typescript', 'rust', 'html', 'css',
    'sql', 'api', 'bug', 'refactor', 'algorithm', 'code', 'docker', 'interface',
    'struct', 'endpoint', 'json', 'grep', 'git', 'npm', 'pipeline'
  ];

  const mathPatterns = [
    'math', 'equation', 'derivative', 'integral', 'matrix', 'calculus',
    'algebra', 'probability', 'proof', 'theorem', 'solve', 'sum', 'limit',
    'sqrt', 'pythagorean', 'polynomial', 'vector', 'logarithm', 'convergence'
  ];

  const reasoningPatterns = [
    'why', 'explain', 'analyze', 'evaluate', 'compare', 'contrast', 'trade-off',
    'pros and cons', 'strategy', 'impact', 'consequence', 'implication',
    'architectural', 'philosophy', 'root cause', 'rationale'
  ];

  const creativePatterns = [
    'write a story', 'poem', 'essay', 'creative', 'slogan', 'dialogue',
    'fiction', 'brainstorm', 'headline', 'marketing copy', 'screenplay'
  ];

  const summarizationPatterns = [
    'summarize', 'summary', 'tldr', 'tl;dr', 'briefly describe', 'condense',
    'key takeaways', 'bullet points of', 'overview of', 'abstract'
  ];

  const translationPatterns = [
    'translate', 'in french', 'in spanish', 'in german', 'in japanese', 'in chinese',
    'in italian', 'in portuguese', 'to english', 'translate this'
  ];

  const factualPatterns = [
    'who is', 'what is', 'when did', 'where is', 'definition of', 'how many',
    'capital of', 'list of', 'which country', 'what year'
  ];

  const imagePatterns = [
    'generate an image', 'generate image', 'create an image', 'create image',
    'draw a ', 'draw an ', 'draw ', 'generate a logo', 'create a logo',
    'generate a photo', 'create a photo', 'paint a ', 'picture of',
    'render an image', 'image of a', 'image of an', 'sketch a', 'illustration of'
  ];

  // Code block detection (e.g. ```typescript ... ```)
  const containsCodeBlock = /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text);
  const isImageIntentRegex = /\b(generate|create|draw|paint|render)\b.*\b(image|photo|picture|logo|sketch|illustration)\b/i.test(lower) || /^\s*draw\b/i.test(lower);

  // Score each task type
  const codeScore = codePatterns.filter(p => lower.includes(p)).length + (containsCodeBlock ? 3 : 0);
  const mathScore = mathPatterns.filter(p => lower.includes(p)).length;
  const reasoningScore = reasoningPatterns.filter(p => lower.includes(p)).length;
  const creativeScore = creativePatterns.filter(p => lower.includes(p)).length;
  const summaryScore = summarizationPatterns.filter(p => lower.includes(p)).length;
  const translationScore = translationPatterns.filter(p => lower.includes(p)).length;
  const factualScore = factualPatterns.filter(p => lower.includes(p)).length;
  const imageScore = imagePatterns.filter(p => lower.includes(p)).length + (isImageIntentRegex ? 5 : 0);

  // Determine Task Type
  let taskType = 'general';
  const scores = [
    { type: 'image_generation', score: imageScore },
    { type: 'coding', score: codeScore },
    { type: 'mathematics', score: mathScore },
    { type: 'reasoning', score: reasoningScore },
    { type: 'creative', score: creativeScore },
    { type: 'summarization', score: summaryScore },
    { type: 'translation', score: translationScore },
    { type: 'factual', score: factualScore }
  ];

  scores.sort((a, b) => b.score - a.score);
  if (scores[0].score > 0) {
    taskType = scores[0].type;
  }

  // Determine Constraints
  const isConcise = /short|brief|concise|quick|tldr|one line|in 2 sentences|summary/i.test(lower);
  const isDetailed = /detailed|comprehensive|step[- ]by[- ]step|thorough|in-depth|explain fully/i.test(lower);
  const isJSON = /json|schema|object payload|structured format/i.test(lower);
  const isMarkdown = /markdown|format as table|bullet points/i.test(lower);

  let brevity = 'standard';
  if (isConcise) brevity = 'concise';
  if (isDetailed) brevity = 'detailed';

  let format = 'unspecified';
  if (isJSON) format = 'json';
  else if (isMarkdown) format = 'markdown';
  else if (containsCodeBlock || taskType === 'coding') format = 'code';

  // Detected Programming or Spoken Language
  let detectedLanguage = null;
  if (/python/i.test(lower)) detectedLanguage = 'Python';
  else if (/javascript|js\b/i.test(lower)) detectedLanguage = 'JavaScript';
  else if (/typescript|ts\b/i.test(lower)) detectedLanguage = 'TypeScript';
  else if (/rust/i.test(lower)) detectedLanguage = 'Rust';
  else if (/french/i.test(lower)) detectedLanguage = 'French';
  else if (/spanish/i.test(lower)) detectedLanguage = 'Spanish';
  else if (/german/i.test(lower)) detectedLanguage = 'German';

  // Latency preference
  let latencyPreference = 'standard';
  if (/quick|fast|instantly|real-time|asap|low latency/i.test(lower)) {
    latencyPreference = 'low';
  } else if (/deep reasoning|complex analysis|thorough proof|deep dive/i.test(lower)) {
    latencyPreference = 'high';
  }

  // Complexity Heuristic Rules
  let complexity = 'medium';
  if (wordCount < 15 && !containsCodeBlock && mathScore === 0) {
    complexity = 'low';
  } else if (wordCount > 100 || containsCodeBlock || mathScore >= 2 || reasoningScore >= 2) {
    complexity = 'high';
  }

  // Concise Intent Generation
  const intent = generateIntentSummary(taskType, text, brevity, detectedLanguage);

  return {
    taskType,
    intent,
    complexity,
    constraints: {
      format,
      brevity,
      language: detectedLanguage,
      latencyPreference
    },
    inputStats: {
      characterCount,
      estimatedWordCount: wordCount
    }
  };
}

/**
 * Helper to generate a concise, explainable intent summary
 */
function generateIntentSummary(taskType, text, brevity, language) {
  const shortSnippet = text.length > 50 ? text.slice(0, 50).trim() + '...' : text.trim();

  switch (taskType) {
    case 'image_generation':
      return `Image generation prompt: "${shortSnippet}"`;
    case 'coding':
      return `Code request${language ? ` in ${language}` : ''}: "${shortSnippet}"`;
    case 'mathematics':
      return `Mathematical problem / analytical evaluation: "${shortSnippet}"`;
    case 'reasoning':
      return `Trade-off analysis or conceptual reasoning: "${shortSnippet}"`;
    case 'creative':
      return `Creative text generation (${brevity}): "${shortSnippet}"`;
    case 'summarization':
      return `Summarization request: "${shortSnippet}"`;
    case 'translation':
      return `Language translation task${language ? ` to ${language}` : ''}: "${shortSnippet}"`;
    case 'factual':
      return `Factual question lookup: "${shortSnippet}"`;
    default:
      return `General query processing: "${shortSnippet}"`;
  }
}
