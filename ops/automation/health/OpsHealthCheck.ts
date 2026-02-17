// B11 – Operations + Growth Automation Layer
// B11-09 — Ops Health Dashboard (aggregated system health checks)

import { getCrmAdapter } from '../crm';
import { getMessageQueue } from '../messaging';
import { getContentOpsManager } from '../content';
import { getOpsAuditLogger } from '../audit/OpsAuditLogger';

// ─── Health Status Types ─────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  detail?: string;
  lastCheckedAt: string;
}

export interface SystemHealth {
  overall: HealthStatus;
  components: ComponentHealth[];
  checkedAt: string;
  safeMode: boolean;
}

// ─── Health Checker ──────────────────────────────────────────────

async function checkComponent(
  name: string,
  checker: () => Promise<boolean>,
): Promise<ComponentHealth> {
  const now = new Date().toISOString();
  try {
    const ok = await checker();
    return {
      name,
      status: ok ? 'healthy' : 'degraded',
      lastCheckedAt: now,
    };
  } catch (err) {
    return {
      name,
      status: 'unhealthy',
      detail: err instanceof Error ? err.message : 'Check failed',
      lastCheckedAt: now,
    };
  }
}

export async function runHealthChecks(safeMode: boolean): Promise<SystemHealth> {
  const components: ComponentHealth[] = [];

  // Audit logger check
  components.push(await checkComponent('Audit Logger', async () => {
    const logger = getOpsAuditLogger();
    // Verify we can read — no write side-effects
    await logger.readAll();
    return true;
  }));

  // CRM adapter check
  components.push(await checkComponent('CRM Adapter', async () => {
    const adapter = getCrmAdapter();
    return adapter.healthCheck();
  }));

  // Email adapter check
  components.push(await checkComponent('Email Adapter', async () => {
    const queue = getMessageQueue();
    const adapter = queue.getAdapter('email');
    return adapter ? adapter.healthCheck() : false;
  }));

  // SMS adapter check
  components.push(await checkComponent('SMS Adapter', async () => {
    const queue = getMessageQueue();
    const adapter = queue.getAdapter('sms');
    return adapter ? adapter.healthCheck() : false;
  }));

  // Content dispatcher check
  components.push(await checkComponent('Content Dispatcher', async () => {
    const manager = getContentOpsManager();
    return manager.healthCheck();
  }));

  // Determine overall status
  const statuses = components.map((c) => c.status);
  let overall: HealthStatus = 'healthy';
  if (statuses.includes('unhealthy')) overall = 'unhealthy';
  else if (statuses.includes('degraded')) overall = 'degraded';

  const result: SystemHealth = {
    overall,
    components,
    checkedAt: new Date().toISOString(),
    safeMode,
  };

  return result;
}

// ─── React Hook for Console ──────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

export function useOpsHealth(safeMode: boolean, intervalMs = 30_000) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await runHealthChecks(safeMode);
      setHealth(result);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [safeMode]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { health, loading, refresh };
}
