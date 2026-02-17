// B11 – Operations + Growth Automation Layer
// B11-06 — Messaging barrel export

export type {
  MessageChannel,
  OutboundMessage,
  SendResult,
  IMessageAdapter,
  WebhookEmailConfig,
} from './MessageAdapter';

export {
  MockEmailAdapter,
  MockSmsAdapter,
  WebhookEmailAdapter,
  MessageQueue,
  getMessageQueue,
  resetMessageQueue,
  addAllowedEmail,
  removeAllowedEmail,
  getAllowedEmails,
  addAllowedPhone,
  removeAllowedPhone,
  getAllowedPhones,
} from './MessageAdapter';
