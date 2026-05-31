const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const canonicalURL = 'https://radzim.app/';
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const robotsSource = fs.readFileSync(path.join(projectRoot, 'robots.txt'), 'utf8');
const sitemapSource = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const vercelConfig = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8')
);

test('landing page exposes complete SEO metadata without keyword stuffing', () => {
  assert.match(indexSource, /<title>Analiza CV pod ofertę pracy \| Radzim<\/title>/);
  assert.match(indexSource, /<meta name="description" content="[^"]+">/);
  assert.match(indexSource, /<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">/);
  assert.match(indexSource, /<link rel="canonical" href="https:\/\/radzim\.app\/">/);
  assert.match(indexSource, /<meta property="og:type" content="website">/);
  assert.match(indexSource, /<meta property="og:url" content="https:\/\/radzim\.app\/">/);
  assert.match(indexSource, /<meta name="twitter:card" content="summary">/);
  assert.doesNotMatch(indexSource, /<meta name="keywords"/);
});

test('landing page exposes valid WebApplication JSON-LD', () => {
  const jsonLDMatch = indexSource.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );

  assert.ok(jsonLDMatch, 'JSON-LD block is missing');

  const jsonLD = JSON.parse(jsonLDMatch[1]);

  assert.equal(jsonLD['@context'], 'https://schema.org');
  assert.equal(jsonLD['@type'], 'WebApplication');
  assert.equal(jsonLD.name, 'Radzim');
  assert.equal(jsonLD.url, canonicalURL);
  assert.equal(jsonLD.offers.price, '0');
  assert.equal(jsonLD.offers.priceCurrency, 'PLN');
});

test('crawler files and www redirect use the canonical domain', () => {
  assert.match(robotsSource, /User-agent: \*/);
  assert.match(robotsSource, /Allow: \//);
  assert.match(robotsSource, /Sitemap: https:\/\/radzim\.app\/sitemap\.xml/);
  assert.match(sitemapSource, /<loc>https:\/\/radzim\.app\/<\/loc>/);

  assert.equal(vercelConfig.redirects[0].destination, 'https://radzim.app/$1');
  assert.equal(vercelConfig.redirects[0].permanent, true);
  assert.deepEqual(vercelConfig.redirects[0].has, [
    { type: 'host', value: 'www.radzim.app' }
  ]);
});
