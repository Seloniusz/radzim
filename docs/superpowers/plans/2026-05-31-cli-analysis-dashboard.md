# CLI Analysis Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render AI CV analysis as a readable two-column dashboard with dynamic CLI-style competency bars instead of raw JSON.

**Architecture:** Extend the validated AI response with optional `skillRatings`. Add a standalone browser-safe renderer module that converts structured analysis data into escaped HTML. Load the renderer from the existing vanilla `index.html`, keeping API transport and presentation separate.

**Tech Stack:** Node.js CommonJS tests, vanilla browser JavaScript, HTML, CSS, OpenRouter JSON mode, Vercel.

---

### Task 1: Extend AI Response Validation

**Files:**
- Modify: `api/analysis-response.js`
- Modify: `test/analysis-response.test.js`
- Modify: `api/analyze.js`

- [ ] **Step 1: Write failing backend tests**

Add test cases that require valid `skillRatings`, reject scores outside `1..5`, and verify the OpenRouter prompt requests `skillRatings`.

- [ ] **Step 2: Run backend tests and verify failure**

Run: `npm test`

Expected: FAIL because `skillRatings` is not validated and the prompt does not request it.

- [ ] **Step 3: Implement minimal backend contract**

Validate optional `skillRatings` as an array of four to six `{ label, score }` entries. Update the prompt JSON example and instructions so the model selects job-relevant categories.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 2: Add Standalone Frontend Renderer

**Files:**
- Create: `analysis-renderer.js`
- Create: `test/analysis-renderer.test.js`

- [ ] **Step 1: Write failing renderer tests**

Test that the renderer:

- renders percentage and label
- renders one five-segment bar per skill rating
- renders strengths, gaps, and changes
- renders only safe HTTP/HTTPS keyword URLs
- renders a readable fallback without a skill panel when ratings are absent
- escapes model-provided HTML

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because `analysis-renderer.js` does not exist.

- [ ] **Step 3: Implement renderer**

Expose `renderAnalysisReport(analysis)` for both browser usage and CommonJS tests. Return semantic HTML with escaped text and filtered links.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS.

### Task 3: Integrate Dashboard Into Existing Page

**Files:**
- Modify: `index.html`
- Modify: `test/analysis-renderer.test.js`

- [ ] **Step 1: Write failing integration assertions**

Assert that `index.html` loads `/analysis-renderer.js`, uses `JSON.parse(data.analysis)`, calls `renderAnalysisReport`, and assigns `innerHTML` only with renderer output.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because the page still assigns raw JSON to `textContent`.

- [ ] **Step 3: Add dashboard styles and renderer integration**

Replace raw text styles with:

- report header with score
- two-column report grid
- dark CLI skill panel
- segmented bars
- keyword tags
- result cards
- mobile one-column breakpoint

Load `/analysis-renderer.js` before the inline script and render parsed API analysis.

- [ ] **Step 4: Run tests and syntax checks**

Run:

```powershell
npm test
node --check api\analyze.js
node --check api\analysis-response.js
node --check analysis-renderer.js
git diff --check
```

Expected: PASS.

### Task 4: Verify Locally In Browser

**Files:**
- No source file changes expected

- [ ] **Step 1: Start local static server**

Run: `npx --yes serve . -l 4173`

- [ ] **Step 2: Open local page with Browser**

Open: `http://localhost:4173`

- [ ] **Step 3: Inject representative analysis fixture**

Call `renderAnalysisReport` in the browser with a fixture matching production JSON and inspect desktop layout.

- [ ] **Step 4: Inspect mobile layout**

Set a mobile viewport and verify the report stacks into one column without horizontal overflow.

### Task 5: Commit, Push, And Verify Production

**Files:**
- Commit all implementation files and tests

- [ ] **Step 1: Run final verification**

Run:

```powershell
npm test
node --check api\analyze.js
node --check api\analysis-response.js
node --check analysis-renderer.js
git diff --check
```

Expected: PASS.

- [ ] **Step 2: Commit and push**

```powershell
git add -- api/analyze.js api/analysis-response.js analysis-renderer.js index.html test/analysis-response.test.js test/analysis-renderer.test.js
git commit -m "feat: render CLI-style analysis dashboard"
git push origin main
```

- [ ] **Step 3: Wait for Vercel deployment**

Use GitHub commit status until the `Vercel` status is `success`.

- [ ] **Step 4: Run production API smoke test**

Send a valid DOCX to `https://radzim.vercel.app/api/analyze`, assert `HTTP 200`, parse `analysis`, and verify `skillRatings`.

- [ ] **Step 5: Verify deployed frontend with Browser**

Open `https://radzim.vercel.app`, render or submit a valid fixture, and verify the structured report instead of raw JSON.
