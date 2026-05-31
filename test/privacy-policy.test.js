const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const policyPath = path.join(projectRoot, 'polityka-prywatnosci.html');

test('privacy policy explains CV processing and data subject rights', () => {
  const policySource = fs.readFileSync(policyPath, 'utf8');

  assert.match(policySource, /Grzegorz Lisowski/);
  assert.match(policySource, /kontakt@radzim\.app/);
  assert.match(policySource, /OpenRouter/);
  assert.match(policySource, /Vercel/);
  assert.match(policySource, /dostawc/);
  assert.match(policySource, /CV/);
  assert.match(policySource, /nie jest zapisywan[ey] w bazie danych/i);
  assert.match(policySource, /zautomatyzowan/i);
  assert.match(policySource, /Urzędu Ochrony Danych Osobowych/);
  assert.match(policySource, /31 maja 2026/);
});
