# Public App SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add indexing, sharing and crawler metadata for the Radzim public landing page under `https://radzim.app/`.

**Architecture:** Keep the single-page application static. Add metadata directly to `index.html`, crawler files at the project root and a host redirect in `vercel.json`. Cover the static contract with a focused Node test.

**Tech Stack:** Static HTML, JSON-LD, XML sitemap, robots.txt, Vercel redirects, Node test runner.

---

### Task 1: SEO Regression Test

**Files:**
- Create: `test/seo.test.js`

- [ ] **Step 1: Write a failing test**

Read `index.html`, `robots.txt`, `sitemap.xml` and `vercel.json`. Assert:

```js
assert.match(indexSource, /<meta name="description"/);
assert.match(indexSource, /<link rel="canonical" href="https:\/\/radzim\.app\/">/);
assert.match(indexSource, /<script type="application\/ld\+json">/);
assert.doesNotMatch(indexSource, /<meta name="keywords"/);
assert.match(robotsSource, /Sitemap: https:\/\/radzim\.app\/sitemap\.xml/);
assert.match(sitemapSource, /<loc>https:\/\/radzim\.app\/<\/loc>/);
assert.equal(vercelConfig.redirects[0].destination, 'https://radzim.app/$1');
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test test/seo.test.js`

Expected: FAIL because `robots.txt`, `sitemap.xml` and SEO metadata do not exist.

### Task 2: Landing Page Metadata

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add static metadata**

Add a descriptive title, meta description, robots directives, canonical URL,
Open Graph fields, Twitter Card fields and JSON-LD for a free browser-based
`WebApplication`.

- [ ] **Step 2: Verify test progress**

Run: `node --test test/seo.test.js`

Expected: FAIL only for missing crawler files or redirect.

### Task 3: Crawler Files and Canonical Redirect

**Files:**
- Create: `robots.txt`
- Create: `sitemap.xml`
- Modify: `vercel.json`

- [ ] **Step 1: Add crawler files**

Allow crawling in `robots.txt` and advertise
`https://radzim.app/sitemap.xml`. Add the canonical root URL to the sitemap.

- [ ] **Step 2: Redirect www host**

Add a permanent Vercel redirect:

```json
{
  "source": "/(.*)",
  "has": [{ "type": "host", "value": "www.radzim.app" }],
  "destination": "https://radzim.app/$1",
  "permanent": true
}
```

- [ ] **Step 3: Run the full verification**

Run:

```powershell
npm test
node --check analysis-renderer.js
git diff --check
```

Expected: all tests pass and no formatting errors.

### Task 4: Deploy and Verify Production

- [ ] **Step 1: Commit and push**

Commit the SEO metadata, crawler files, redirect, tests, specification and plan.

- [ ] **Step 2: Wait for Vercel deployment**

Confirm Vercel reports `success` for the pushed commit.

- [ ] **Step 3: Verify production URLs**

Request:

```text
https://radzim.app/
https://radzim.app/robots.txt
https://radzim.app/sitemap.xml
https://www.radzim.app/
```

Confirm metadata is served on the canonical host and `www` redirects to
`https://radzim.app/`.
