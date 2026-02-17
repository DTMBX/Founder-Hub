/**
 * B12-02 — Runner Errors
 *
 * Typed error classes for the Runner Service.
 * Every failure mode has a distinct error type for auditing.
 */

/** Base class for all runner errors. */
export class RunnerError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'RunnerError';
    this.code = code;
  }
}

/** Command ID is not in the registry. */
export class CommandNotFoundError extends RunnerError {
  constructor(commandId: string) {
    super('COMMAND_NOT_FOUND', `Command "${commandId}" is not in the registry.`);
    this.name = 'CommandNotFoundError';
  }
}

/** Argument validation failed against args_schema. */
export class ArgumentValidationError extends RunnerError {
  readonly violations: string[];
  constructor(commandId: string, violations: string[]) {
    super(
      'ARGUMENT_VALIDATION_FAILED',
      `Argument validation failed for "${commandId}": ${violations.join('; ')}`,
    );
    this.name = 'ArgumentValidationError';
    this.violations = violations;
  }
}

/** Role is not in the command's roles_allowed list. */
export class RoleNotAllowedError extends RunnerError {
  constructor(commandId: string, role: string) {
    super('ROLE_NOT_ALLOWED', `Role "${role}" is not allowed to execute "${commandId}".`);
    this.name = 'RoleNotAllowedError';
  }
}

/** Safe Mode blocks this command. */
export class SafeModeBlockedError extends RunnerError {
  constructor(commandId: string, reason: string) {
    super('SAFE_MODE_BLOCKED', `Safe Mode blocks "${commandId}": ${reason}`);
    this.name = 'SafeModeBlockedError';
  }
}

/** Command exceeded its timeout. */
export class TimeoutError extends RunnerError {
  constructor(commandId: string, timeoutMs: number) {
    super('TIMEOUT', `Command "${commandId}" timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
  }
}

/** Working directory policy violated. */
export class WorkingDirViolationError extends RunnerError {
  constructor(commandId: string, requestedDir: string) {
    super('WORKING_DIR_VIOLATION', `Working directory "${requestedDir}" not permitted for "${commandId}".`);
    this.name = 'WorkingDirViolationError';
  }
}

/** Network egress not permitted for this command. */
export class EgressNotPermittedError extends RunnerError {
  constructor(commandId: string) {
    super('EGRESS_NOT_PERMITTED', `Command "${commandId}" does not have network_egress side_effects — egress denied.`);
    this.name = 'EgressNotPermittedError';
  }
}
