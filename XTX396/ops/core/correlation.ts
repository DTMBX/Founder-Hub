// B11.1 – Gap-Fill Hardening
// D7 — Correlation ID: deterministic request-scoped tracing
//
// Every user-initiated action should receive a correlation ID that threads
// through UI → API → audit → adapter → webhook. This makes searching audit
// logs trivial and links cause to effect across the stack.

/**
 * Generate a new correlation ID.
 * Format: `cor_<randomUUID>` — prefixed for easy grep in logs.
 */
export function generateCorrelationId(): string {
  return `cor_${crypto.randomUUID()}`;
}

/**
 * Lightweight async-local-style context for correlation IDs.
 * In a browser environment, we use a simple stack because there is
 * only one thread. In Node.js, this would be backed by AsyncLocalStorage.
 */
const _correlationStack: string[] = [];

/** Push a correlation ID onto the context stack. */
export function pushCorrelation(id: string): void {
  _correlationStack.push(id);
}

/** Pop the current correlation ID. */
export function popCorrelation(): string | undefined {
  return _correlationStack.pop();
}

/** Get the current correlation ID (top of stack), or undefined. */
export function currentCorrelationId(): string | undefined {
  return _correlationStack.length > 0
    ? _correlationStack[_correlationStack.length - 1]
    : undefined;
}

/**
 * Run a function with a scoped correlation ID.
 * The correlation ID is popped automatically when the function completes
 * (or throws), even for async functions.
 */
export async function withCorrelation<T>(
  id: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  pushCorrelation(id);
  try {
    return await fn();
  } finally {
    popCorrelation();
  }
}
