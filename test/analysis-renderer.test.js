const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const { renderAnalysisReport } = require('../analysis-renderer');

const analysis = {
  matchPercentage: 85,
  whatWorks: ['REST API testing', '<script>alert("xss")</script>'],
  whatsMissing: ['Add measurable results'],
  concreteChanges: ['Describe regression improvements'],
  keywords: [
    { term: 'ISTQB', url: 'https://glossary.istqb.org' },
    { term: 'Unsafe', url: 'javascript:alert(1)' }
  ],
  skillRatings: [
    { label: 'Manual testing', score: 5 },
    { label: 'API + SQL', score: 4 },
    { label: 'Automation', score: 3 },
    { label: 'CI/CD', score: 2 }
  ]
};

test('renders a readable dashboard with segmented competency bars', () => {
  const html = renderAnalysisReport(analysis);

  assert.match(html, /85%/);
  assert.match(html, /Manual testing/);
  assert.match(html, /5\/5/);
  assert.equal((html.match(/skill-segment/g) || []).length, 20);
  assert.match(html, /Mocne strony/);
  assert.match(html, /Luki do uzupełnienia/);
  assert.match(html, /Następne kroki/);
});

test('escapes model-provided text and renders only safe keyword links', () => {
  const html = renderAnalysisReport(analysis);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/glossary\.istqb\.org\/?"/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test('renders the report without competency panel when ratings are absent', () => {
  const html = renderAnalysisReport({ ...analysis, skillRatings: undefined });

  assert.match(html, /85%/);
  assert.doesNotMatch(html, /skill-matrix/);
  assert.match(html, /Mocne strony/);
});

test('page parses structured analysis and renders HTML instead of raw JSON', () => {
  assert.match(indexSource, /<script src="\/analysis-renderer\.js"><\/script>/);
  assert.match(indexSource, /JSON\.parse\(data\.analysis\)/);
  assert.match(indexSource, /renderAnalysisReport\(analysis\)/);
  assert.doesNotMatch(indexSource, /analysisContent\.textContent = data\.analysis/);
});
