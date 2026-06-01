const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const canonicalURL = 'https://radzim.app/';
const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const robotsSource = fs.readFileSync(path.join(projectRoot, 'robots.txt'), 'utf8');
const sitemapSource = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const manifestPath = path.join(projectRoot, 'site.webmanifest');
const faviconSvgPath = path.join(projectRoot, 'favicon.svg');
const faviconIcoPath = path.join(projectRoot, 'favicon.ico');
const appleTouchIconPath = path.join(projectRoot, 'apple-touch-icon.png');
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

test('landing page exposes favicon assets for browsers and search results', () => {
  assert.match(indexSource, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.match(indexSource, /<link rel="icon" href="\/favicon\.ico" sizes="any">/);
  assert.match(indexSource, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/);
  assert.match(indexSource, /<link rel="manifest" href="\/site\.webmanifest">/);

  assert.ok(fs.existsSync(faviconSvgPath), 'favicon.svg is missing');
  assert.ok(fs.existsSync(faviconIcoPath), 'favicon.ico is missing');
  assert.ok(fs.existsSync(appleTouchIconPath), 'apple-touch-icon.png is missing');
  assert.ok(fs.existsSync(manifestPath), 'site.webmanifest is missing');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'Radzim');
  assert.equal(manifest.short_name, 'Radzim');
  assert.equal(manifest.icons[0].src, '/apple-touch-icon.png');
  assert.equal(manifest.icons[0].sizes, '180x180');
});
