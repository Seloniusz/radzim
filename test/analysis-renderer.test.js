const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const stylesSource = fs.readFileSync(path.join(projectRoot, 'styles.css'), 'utf8');
const rendererSource = fs.readFileSync(path.join(projectRoot, 'analysis-renderer.js'), 'utf8');
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

test('exposes browser renderer even when a CommonJS module global exists', () => {
  const context = {
    module: { exports: {} },
    URL
  };

  vm.runInNewContext(rendererSource, context);

  assert.equal(typeof context.renderAnalysisReport, 'function');
  assert.equal(typeof context.module.exports.renderAnalysisReport, 'function');
});

test('page uses the Wero-inspired editorial visual system', () => {
  assert.match(indexSource, /<link rel="stylesheet" href="\/styles\.css">/);
  assert.match(stylesSource, /--paper:\s*#fff8dd/);
  assert.match(stylesSource, /--ink:\s*#141414/);
  assert.match(stylesSource, /--neon-green:\s*#7bff69/);
  assert.match(stylesSource, /--cyan:\s*#82f3ff/);
  assert.match(stylesSource, /--hot-pink:\s*#ff678b/);
  assert.match(indexSource, /class="wordmark"/);
  assert.match(indexSource, /class="loading-segments"/);
  assert.doesNotMatch(stylesSource, /#667eea/i);
  assert.doesNotMatch(stylesSource, /#764ba2/i);
  assert.doesNotMatch(stylesSource, /background:\s*#172820/i);
});

test('hero introduction uses an editorial brief treatment', () => {
  assert.match(indexSource, /class="hero-brief"/);
  assert.match(indexSource, /class="hero-brief-label">brief</);
  assert.match(stylesSource, /\.hero-brief\s*{/);
  assert.match(stylesSource, /\.hero-brief::before\s*{/);
  assert.match(stylesSource, /\.hero-brief-label\s*{/);
});

test('hero explains AI-assisted CV scoring guidance', () => {
  assert.match(
    indexSource,
    /class="hero-ai-note">ZA POMOCĄ SZTUCZNEJ INTELIGENCJI</
  );
  assert.match(
    indexSource,
    /instrukcje, co uzupełnić, aby algorytmy rekrutacyjne wyżej oceniły Twoje CV/
  );
  assert.match(stylesSource, /\.hero-ai-note\s*{/);
});

test('visible interface labels do not imitate shell commands', () => {
  assert.doesNotMatch(indexSource, />\s*\$\s*[a-z_]/i);
  assert.doesNotMatch(rendererSource, /\$\s*[a-z_]/i);
  assert.doesNotMatch(rendererSource, /--[a-z_=-]+/i);
});

test('masthead exposes a compact privacy policy link', () => {
  assert.match(indexSource, /class="masthead-actions"/);
  assert.match(
    indexSource,
    /class="privacy-link" href="\/polityka-prywatnosci\.html">polityka prywatności<\/a>/
  );
  assert.match(stylesSource, /\.privacy-link\s*{/);
});
