# Privacy Policy and CV Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an accessible privacy policy and harden temporary CV processing without changing the landing-page composition.

**Architecture:** Add a masthead pill link and a standalone static privacy-policy page that shares the current stylesheet. Update the serverless analysis handler to delete temporary uploads in a `finally` block, reduce sensitive logging and force OpenRouter ZDR routing.

**Tech Stack:** Static HTML, CSS, Node.js serverless function, Formidable, OpenRouter API, Node test runner.

---

### Task 1: Add Regression Tests

**Files:**
- Modify: `test/analysis-renderer.test.js`
- Modify: `test/runtime-config.test.js`
- Create: `test/privacy-policy.test.js`

- [ ] Assert the main page links to `/polityka-prywatnosci.html`.
- [ ] Assert the privacy page contains administrator, contact, recipients,
  rights and automated-analysis information.
- [ ] Assert the backend tracks temporary files, deletes them in `finally`,
  forces `provider: { zdr: true }`, uses `https://radzim.app` as its default
  referrer and does not log the filename or job URL.
- [ ] Run `npm test` and confirm the new assertions fail.

### Task 2: Add Privacy Policy UI

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Create: `polityka-prywatnosci.html`

- [ ] Add `.masthead-actions` around the existing system label and a new
  `.privacy-link`.
- [ ] Create the standalone policy page with the approved privacy sections.
- [ ] Add policy-page styles and responsive wrapping for masthead pills.
- [ ] Run `npm test` and confirm the UI assertions pass.

### Task 3: Harden CV Handling

**Files:**
- Modify: `api/analyze.js`

- [ ] Track temporary upload paths on Formidable `fileBegin`.
- [ ] Delete tracked paths with `fs.unlink()` in `finally`.
- [ ] Remove sensitive filename, job URL and provider-body logging.
- [ ] Update default `APP_URL` to `https://radzim.app`.
- [ ] Add `provider: { zdr: true }` to OpenRouter requests.
- [ ] Run `npm test` and syntax checks.

### Task 4: Deploy and Verify

- [ ] Commit and push changes.
- [ ] Wait for Vercel deployment success.
- [ ] Verify `/polityka-prywatnosci.html` and masthead UI on desktop and mobile.
- [ ] Run a real production API analysis to verify ZDR-compatible routing for
  the configured OpenRouter model.
