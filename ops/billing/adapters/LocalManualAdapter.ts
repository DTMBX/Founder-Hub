/**
 * B14-P4 — Local Manual Payment Adapter
 *
 * Stub adapter for manual/offline payment recording.
 * No external service calls — all operations are in-memory.
 */

import type {
  PaymentAdapter,
  PaymentResult,
  PaymentMethod,
} from './PaymentAdapter';

export class LocalManualAdapter implements PaymentAdapter {
  readonly name = 'local-manual';
  private transactions: PaymentResult[] = [];

  async processPayment(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentResult> {
    const result: PaymentResult = {
      success: true,
      transactionId: `TXN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      processedAt: new Date().toISOString(),
      method: params.method,
      amount: params.amount,
      currency: params.currency,
    };

    this.transactions.push(result);
    return result;
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return { healthy: true, message: 'Local manual adapter operational' };
  }

  /** Get all recorded transactions (for testing/auditing). */
  getTransactions(): readonly PaymentResult[] {
    return [...this.transactions];
  }

  /** Reset (for testing). */
  _reset(): void {
    this.transactions.length = 0;
  }
}
