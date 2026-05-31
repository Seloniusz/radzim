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

test('OpenRouter request requires JSON output and excludes reasoning text', () => {
  assert.match(
    analyzeSource,
    /response_format:\s*\{\s*type:\s*'json_object'\s*\}/
  );
  assert.match(
    analyzeSource,
    /reasoning:\s*\{\s*effort:\s*'none',\s*exclude:\s*true\s*\}/
  );
});

test('OpenRouter prompt requests dynamic competency ratings', () => {
  assert.match(analyzeSource, /"skillRatings": \[/);
  assert.match(analyzeSource, /score: liczba całkowita 1-5/);
  assert.match(analyzeSource, /dobierz dynamicznie do analizowanej oferty/);
});
