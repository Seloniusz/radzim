# Job Offer Reader Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Obsłużyć publiczne oferty blokujące requesty Vercela przez fallback Jina Reader po odpowiedzi `403`.

**Architecture:** Wydzielić pobieranie ofert z `api/analyze.js` do `api/job-offer.js`. Moduł najpierw pobiera stronę bezpośrednio, a tylko po `403` korzysta z `https://r.jina.ai/<url>`. Moduł odrzuca URL-e lokalne i prywatne przed wykonaniem requestu.

**Tech Stack:** Node.js, Axios, Cheerio, Node test runner, Vercel Functions.

---

### Task 1: Testy kontraktu pobierania ofert

**Files:**
- Create: `test/job-offer.test.js`

- [ ] **Step 1: Write failing tests**

Dodaj testy dla bezpośredniego HTML, fallbacku Reader po `403`, braku fallbacku po
`500` oraz odrzucenia `http://127.0.0.1`.

- [ ] **Step 2: Verify red state**

Run: `node --test test/job-offer.test.js`

Expected: FAIL, ponieważ moduł `api/job-offer.js` jeszcze nie istnieje.

### Task 2: Moduł pobierania ofert

**Files:**
- Create: `api/job-offer.js`
- Modify: `api/analyze.js`

- [ ] **Step 1: Implement URL validation**

Dodaj `validatePublicJobUrl(url)`, które akceptuje `http:` i `https:`, ale odrzuca
localhost oraz prywatne adresy IPv4 i IPv6.

- [ ] **Step 2: Implement direct fetch and Reader fallback**

Dodaj `scrapeJobOffer(url, { httpClient = axios } = {})`. Użyj bezpośredniego GET
jako pierwszej ścieżki. Po `403` wykonaj GET do
`https://r.jina.ai/${validatedUrl}`. W obu ścieżkach znormalizuj tekst i ogranicz
go do `8000` znaków.

- [ ] **Step 3: Replace inline scraper**

Zaimportuj `scrapeJobOffer` w `api/analyze.js` i usuń starą lokalną implementację.

- [ ] **Step 4: Verify green state**

Run: `node --test test/job-offer.test.js`

Expected: PASS.

### Task 3: Polityka prywatności

**Files:**
- Modify: `polityka-prywatnosci.html`
- Modify: `test/privacy-policy.test.js`

- [ ] **Step 1: Write failing privacy test**

Dodaj asercję, że polityka informuje o Jina AI i przekazywaniu wyłącznie
publicznego URL-a oferty.

- [ ] **Step 2: Verify red state**

Run: `node --test test/privacy-policy.test.js`

Expected: FAIL przed zmianą polityki.

- [ ] **Step 3: Update policy**

Dopisz Jina AI jako opcjonalnego odbiorcę publicznego URL-a oferty w sekcji
odbiorców danych.

- [ ] **Step 4: Verify green state**

Run: `node --test test/privacy-policy.test.js`

Expected: PASS.

### Task 4: Weryfikacja i wdrożenie

**Files:**
- Verify all modified files

- [ ] **Step 1: Run local verification**

Run: `npm test`

Expected: wszystkie testy PASS.

Run: `node --check api/job-offer.js && node --check api/analyze.js`

Expected: exit code `0`.

Run: `git diff --check`

Expected: brak błędów whitespace.

- [ ] **Step 2: Commit and deploy**

Run:

```bash
git add api/job-offer.js api/analyze.js test/job-offer.test.js polityka-prywatnosci.html test/privacy-policy.test.js docs/superpowers
git commit -m "fix: add reader fallback for blocked job offers"
git push origin main
```

- [ ] **Step 3: Run production smoke**

Wyślij przykładowe CV do `https://radzim.app/api/analyze` z podanym URL-em
Pracuj.pl.

Expected: HTTP `200` i poprawny raport JSON z ocenami kompetencji.

