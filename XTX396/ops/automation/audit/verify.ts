// B11 – Operations + Growth Automation Layer
// Audit log integrity verification script
// Usage: npx tsx ops/automation/audit/verify.ts [path-to-jsonl]

import { JsonlFileSink, OpsAuditLogger } from './OpsAuditLogger';

async function main() {
  const filePath = process.argv[2] ?? 'ops/outbox/audit.jsonl';

  console.log(`Verifying audit log: ${filePath}`);

  const sink = new JsonlFileSink(filePath);
  const logger = new OpsAuditLogger([sink]);
  const result = await logger.verify();

  if (result.valid) {
    const events = await logger.readAll();
    console.log(`PASS — ${events.length} event(s) verified, all payload hashes valid.`);
    process.exit(0);
  } else {
    console.error(`FAIL — ${result.errors.length} integrity error(s):`);
    for (const err of result.errors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
