const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const vercelConfig = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8')
);
const analyzeSource = fs.readFileSync(
  path.join(projectRoot, 'api', 'analyze.js'),
  'utf8'
);

test('OpenRouter timeout leaves time for the function to return an error response', () => {
  const functionDurationSeconds =
    vercelConfig.functions['api/**/*.js'].maxDuration;
  const timeoutMatch = analyzeSource.match(
    /const OPENROUTER_TIMEOUT_MS = (\d+);/
  );

  assert.ok(timeoutMatch, 'OPENROUTER_TIMEOUT_MS constant is missing');

  const openRouterTimeoutMs = Number.parseInt(timeoutMatch[1], 10);
  const responseMarginMs = functionDurationSeconds * 1000 - openRouterTimeoutMs;

  assert.ok(
    responseMarginMs >= 10000,
    `expected at least 10000 ms response margin, got ${responseMarginMs} ms`
  );
});
