/**
 * B15-P5 — Highlight Tools Integration
 *
 * Risk scoring and acceptance criteria tools that connect into the
 * ToolHub platform. These are deterministic, rule-based evaluators
 * — no hidden inference or probabilistic outcomes.
 */

import { createHash } from 'crypto';

// ── Risk Scoring ────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  id: string;
  label: string;
  weight: number;   // 0–1
  present: boolean;
}

export interface RiskReport {
  reportId: string;
  subjectId: string;
  subjectType: string;
  factors: RiskFactor[];
  score: number;          // 0–100
  level: RiskLevel;
  evaluatedAt: string;
  reportHash: string;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${r}`;
}

export function evaluateRisk(subjectId: string, subjectType: string, factors: RiskFactor[]): RiskReport {
  if (!subjectId) throw new Error('subjectId is required');
  if (factors.length === 0) throw new Error('At least one risk factor is required');

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) throw new Error('Total weight must be greater than zero');

  const weightedSum = factors
    .filter((f) => f.present)
    .reduce((sum, f) => sum + f.weight, 0);

  const score = Math.round((weightedSum / totalWeight) * 100);
  const level = riskLevelFromScore(score);
  const reportId = generateId('RISK');
  const now = new Date().toISOString();

  const reportHash = sha256(
    JSON.stringify({ reportId, subjectId, subjectType, score, evaluatedAt: now }),
  );

  return {
    reportId,
    subjectId,
    subjectType,
    factors: [...factors],
    score,
    level,
    evaluatedAt: now,
    reportHash,
  };
}

// ── Acceptance Criteria ─────────────────────────────────────────

export type CriterionResult = 'pass' | 'fail' | 'skip';

export interface AcceptanceCriterion {
  id: string;
  label: string;
  required: boolean;
  check: () => CriterionResult;
}

export interface AcceptanceReport {
  reportId: string;
  targetId: string;
  criteria: Array<{
    id: string;
    label: string;
    required: boolean;
    result: CriterionResult;
  }>;
  passed: boolean;
  passCount: number;
  failCount: number;
  skipCount: number;
  evaluatedAt: string;
  reportHash: string;
}

export function evaluateAcceptance(
  targetId: string,
  criteria: AcceptanceCriterion[],
): AcceptanceReport {
  if (!targetId) throw new Error('targetId is required');
  if (criteria.length === 0) throw new Error('At least one criterion is required');

  const results = criteria.map((c) => ({
    id: c.id,
    label: c.label,
    required: c.required,
    result: c.check(),
  }));

  const passCount = results.filter((r) => r.result === 'pass').length;
  const failCount = results.filter((r) => r.result === 'fail').length;
  const skipCount = results.filter((r) => r.result === 'skip').length;

  // Pass only if no required criteria failed
  const requiredFailures = results.filter((r) => r.required && r.result === 'fail');
  const passed = requiredFailures.length === 0;

  const reportId = generateId('ACC');
  const now = new Date().toISOString();
  const reportHash = sha256(
    JSON.stringify({ reportId, targetId, passed, passCount, failCount, evaluatedAt: now }),
  );

  return {
    reportId,
    targetId,
    criteria: results,
    passed,
    passCount,
    failCount,
    skipCount,
    evaluatedAt: now,
    reportHash,
  };
}
