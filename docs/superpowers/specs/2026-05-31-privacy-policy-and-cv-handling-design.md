# Privacy Policy and CV Handling Design

## Goal

Publish an accessible privacy policy for the public Radzim application without
adding explanatory text to the upload form, and harden temporary CV processing.

## Main Page

Keep the existing landing page composition unchanged. Add one small outlined
pill link to the right of the existing `cv match system / 01` label:

```text
polityka prywatności
```

The link points to `/polityka-prywatnosci.html`. The two pills form a compact
masthead action group and wrap cleanly on narrow screens.

## Privacy Policy Page

Create `/polityka-prywatnosci.html` using the existing editorial visual system.
The page contains:

- administrator identity: Grzegorz Lisowski;
- contact address: `kontakt@radzim.app`;
- scope and purpose of CV processing;
- legal basis and voluntary nature of submitting a CV;
- temporary processing and absence of database storage;
- categories of recipients: Vercel, OpenRouter and AI model providers;
- possible processing outside the EEA;
- runtime logging information;
- automated analysis notice;
- data subject rights and right to complain to the supervisory authority;
- policy update date.

The document is informational content, not a legal consent form. The main page
must not claim that clicking the analysis button constitutes acceptance of a
privacy policy.

## Backend Hardening

Update `api/analyze.js`:

- track uploaded temporary file paths from `formidable`;
- remove temporary files in `finally`, including error paths;
- stop logging the uploaded filename, job URL and complete provider error body;
- use `https://radzim.app` as the default application URL;
- add OpenRouter provider routing with `zdr: true`.

`provider.zdr` restricts a request to endpoints that declare zero data
retention. If the current free model has no compatible endpoint at request
time, the API should return an error rather than route the CV through a
retaining endpoint.

## Verification

Tests assert:

- the masthead privacy link exists;
- the policy page contains administrator contact, recipients, rights and
  automated-analysis information;
- the backend uses `finally`, `fs.unlink()` and OpenRouter ZDR;
- sensitive logging statements are absent;
- the default OpenRouter referrer uses `https://radzim.app`.

Run a production smoke test after deployment because ZDR availability depends
on OpenRouter provider routing at runtime.

## References

- GDPR Articles 12 and 13:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=PL
- UODO layered information:
  https://uodo.gov.pl/file/1388
- OpenRouter ZDR:
  https://openrouter.ai/docs/guides/features/zdr
