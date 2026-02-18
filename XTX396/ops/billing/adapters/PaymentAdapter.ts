/**
 * B14-P4 — Payment Adapter Interface
 *
 * Abstract adapter for payment processing.
 * Concrete implementations connect to Stripe, PayPal, or manual invoicing.
 */

export type PaymentMethod = 'card' | 'ach' | 'wire' | 'check' | 'manual';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  processedAt: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
}

export interface PaymentAdapter {
  /** Adapter name (for logging/audit). */
  readonly name: string;

  /** Process a payment. */
  processPayment(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentResult>;

  /** Check adapter health. */
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
}
