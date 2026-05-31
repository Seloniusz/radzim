const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeAnalysisContent } = require('../api/analysis-response');

test('removes model reasoning text before returning analysis JSON', () => {
  const response = `We need to produce JSON only. First compare requirements.
{
  "matchPercentage": 90,
  "whatWorks": ["REST API testing"],
  "whatsMissing": ["Add measurable outcomes"],
  "concreteChanges": ["Quantify regression improvements"],
  "keywords": [{"term": "ISTQB", "url": "https://glossary.istqb.org"}]
}`;

  assert.equal(
    normalizeAnalysisContent(response),
    JSON.stringify(
      {
        matchPercentage: 90,
        whatWorks: ['REST API testing'],
        whatsMissing: ['Add measurable outcomes'],
        concreteChanges: ['Quantify regression improvements'],
        keywords: [{ term: 'ISTQB', url: 'https://glossary.istqb.org' }]
      },
      null,
      2
    )
  );
});

test('rejects an incomplete model response without exposing it', () => {
  assert.throws(
    () => normalizeAnalysisContent('We need to produce JSON only. First compare requirements.'),
    /OpenRouter zwrócił nieprawidłowy format analizy/
  );
});
