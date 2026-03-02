const { execSync } = require('child_process');
const pattern = process.argv[2] || 'feature-flags.test';
try {
  const result = execSync(`npx vitest run ${pattern}`, {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 20,
    cwd: process.cwd()
  });
  console.log('ALL PASSED');
  const lines = result.split('\n');
  lines.filter(l => /Test Files|Tests\s|Duration/.test(l))
    .forEach(l => console.log(l));
} catch (e) {
  const out = (e.stdout || '') + '\n' + (e.stderr || '');
  // Show last 80 lines for failure detail
  const lines = out.split('\n');
  lines.slice(-80).forEach(l => console.log(l));
}
