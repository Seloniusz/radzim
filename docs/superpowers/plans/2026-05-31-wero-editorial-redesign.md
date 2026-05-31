# Wero-Inspired Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the full Radzim interface into a warm, flat editorial system inspired by Sowieso Wero without changing application behavior.

**Architecture:** Keep the existing HTML structure and renderer module. Update CSS tokens and minimal markup for the application shell and loading state. Preserve the backend contract and renderer data flow.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Node.js tests, Browser QA, Vercel.

---

### Task 1: Add Visual Regression Assertions

**Files:**
- Modify: `test/analysis-renderer.test.js`

- [ ] Assert that `index.html` defines editorial color variables, a segmented loader, and a wordmark.
- [ ] Assert that legacy purple gradient and dark skill panel values are absent.
- [ ] Run `npm test` and confirm RED.

### Task 2: Restyle Application Shell And Loading

**Files:**
- Modify: `index.html`

- [ ] Add CSS variables for warm gradient, ink, paper, neon green, cyan, pink, and yellow.
- [ ] Replace shell, header, form, controls, CTA, and loading styles.
- [ ] Add wordmark, editorial headline, and segmented loader markup.
- [ ] Run `npm test`.

### Task 3: Restyle Structured Results

**Files:**
- Modify: `index.html`
- Modify: `analysis-renderer.js`

- [ ] Replace dark terminal panel styles with flat outlined paper panels.
- [ ] Restyle score badge, competency bars, keyword tags, and result section accents.
- [ ] Preserve semantic output and safe URL behavior.
- [ ] Run `npm test`, JS syntax checks, and `git diff --check`.

### Task 4: Verify In Browser

**Files:**
- No committed file changes expected

- [ ] Generate local preview using representative structured data.
- [ ] Inspect desktop `1280x900`.
- [ ] Inspect mobile `390x844`.
- [ ] Verify no horizontal overflow and no console warnings.

### Task 5: Deploy And Smoke Test

**Files:**
- Commit redesign files and tests

- [ ] Run complete verification.
- [ ] Commit and push to `main`.
- [ ] Wait for Vercel deployment success.
- [ ] Send a production DOCX request and verify `HTTP 200` with valid `skillRatings`.
- [ ] Open deployed frontend and verify clean console.
