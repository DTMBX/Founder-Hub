// B11 – Operations + Growth Automation Layer
// B11-07 — Content ops barrel export

export type {
  ContentRequestStatus,
  ContentType,
  ContentRequest,
  ContentRequestInput,
  IContentWorkflowDispatcher,
  GitHubActionsConfig,
} from './ContentOps';

export {
  MockContentDispatcher,
  GitHubActionsDispatcher,
  ContentOpsManager,
  getContentOpsManager,
  resetContentOpsManager,
} from './ContentOps';
