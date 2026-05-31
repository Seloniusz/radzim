const assert = require('node:assert/strict');
const test = require('node:test');

const { scrapeJobOffer } = require('../api/job-offer');

test('returns normalized text from a directly accessible job offer', async () => {
  const calls = [];
  const httpClient = {
    async get(url) {
      calls.push(url);
      return {
        data: '<html><body><header>Navigation</header><main> Senior Tester REST API SQL Agile regression testing. Candidate prepares test scenarios, verifies integrations, reports defects and cooperates with developers. </main><script>ignored()</script></body></html>'
      };
    }
  };

  const result = await scrapeJobOffer('https://example.com/job', { httpClient });

  assert.equal(result, 'Senior Tester REST API SQL Agile regression testing. Candidate prepares test scenarios, verifies integrations, reports defects and cooperates with developers.');
  assert.deepEqual(calls, ['https://example.com/job']);
});

test('uses Jina Reader fallback only after a blocked direct request', async () => {
  const calls = [];
  const httpClient = {
    async get(url) {
      calls.push(url);

      if (calls.length === 1) {
        const error = new Error('Request failed with status code 403');
        error.response = { status: 403 };
        throw error;
      }

      return {
        data: 'Title: Oferta pracy\n\nMarkdown Content:\n# Agent nieruchomości\n\n## Nasze wymagania\n\nPrawo jazdy, sprzedaż, organizacja pracy i kontakt z klientem. Samodyscyplina, pozyskiwanie zleceń i prezentacja nieruchomości.'
      };
    }
  };

  const result = await scrapeJobOffer('https://www.pracuj.pl/praca/example,oferta,123', {
    httpClient
  });

  assert.match(result, /Agent nieruchomości/);
  assert.match(result, /Prawo jazdy/);
  assert.deepEqual(calls, [
    'https://www.pracuj.pl/praca/example,oferta,123',
    'https://r.jina.ai/https://www.pracuj.pl/praca/example,oferta,123'
  ]);
});

test('does not use Reader fallback after an error other than 403', async () => {
  const calls = [];
  const httpClient = {
    async get(url) {
      calls.push(url);
      const error = new Error('Request failed with status code 500');
      error.response = { status: 500 };
      throw error;
    }
  };

  await assert.rejects(
    () => scrapeJobOffer('https://example.com/job', { httpClient }),
    /Nie udało się pobrać oferty: Request failed with status code 500/
  );
  assert.deepEqual(calls, ['https://example.com/job']);
});

test('rejects private job offer URLs before making a request', async () => {
  const httpClient = {
    async get() {
      throw new Error('HTTP request should not be called');
    }
  };

  await assert.rejects(
    () => scrapeJobOffer('http://127.0.0.1/internal', { httpClient }),
    /Adres oferty musi prowadzić do publicznej strony/
  );
});
