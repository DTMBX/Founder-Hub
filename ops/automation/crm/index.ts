// B11 – Operations + Growth Automation Layer
// B11-04 — CRM barrel export

export type {
  CrmContact,
  CrmSyncDirection,
  CrmSyncResult,
  ICrmAdapter,
  WebhookCrmConfig,
} from './CrmAdapter';

export {
  LocalJsonCrmAdapter,
  WebhookCrmAdapter,
  getCrmAdapter,
  setCrmAdapter,
  resetCrmAdapter,
  addAllowedCrmDomain,
  removeAllowedCrmDomain,
  getAllowedCrmDomains,
} from './CrmAdapter';
