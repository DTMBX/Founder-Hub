// B11 – Operations + Growth Automation Layer
// B11-03 — Lead capture barrel export

export type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadCreateInput,
  LeadUpdateInput,
  ILeadRepository,
  ValidationResult,
} from './LeadModel';

export {
  validateLeadInput,
  InMemoryLeadRepository,
  JsonFileLeadRepository,
  getLeadRepository,
  setLeadRepository,
} from './LeadModel';

export { handleLeadRequest } from './lead-api';
export type { ApiRequest, ApiResponse } from './lead-api';

export {
  LeadRateLimiter,
  getLeadRateLimiter,
  resetLeadRateLimiter,
} from './rate-limit';
export type { RateLimitConfig } from './rate-limit';
