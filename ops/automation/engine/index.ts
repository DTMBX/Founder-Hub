// B11 – Operations + Growth Automation Layer
// B11-05 — Follow-up automations barrel export

export type {
  AutomationTrigger,
  AutomationActionType,
  AutomationCondition,
  AutomationAction,
  AutomationRule,
  AutomationRuleInput,
  ExecutionStatus,
  AutomationExecution,
  ActionHandler,
} from './AutomationEngine';

export {
  evaluateConditions,
  registerActionHandler,
  AutomationEngine,
  getAutomationEngine,
  resetAutomationEngine,
} from './AutomationEngine';
