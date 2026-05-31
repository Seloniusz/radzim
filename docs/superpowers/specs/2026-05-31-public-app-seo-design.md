# Public App SEO Design

## Goal

Prepare the public Radzim landing page for indexing while the app still uses
`https://radzim.vercel.app/` as its temporary production URL.

## Scope

The SEO package covers the single public landing page:

- descriptive page title and meta description;
- canonical URL pointing to `https://radzim.vercel.app/`;
- crawler directives for indexing and snippets;
- Open Graph and Twitter Card metadata for shared links;
- JSON-LD describing Radzim as a free browser-based `WebApplication`;
- root-level `robots.txt`;
- root-level `sitemap.xml`;
- regression tests for the metadata and crawler files.

## Search Intent

The visible copy and metadata should describe the product naturally using the
following search concepts:

- analiza CV pod ofertę pracy;
- dopasowanie CV do ogłoszenia;
- sprawdzenie CV przed wysłaniem;
- rekomendacje do CV;
- analiza CV AI.

The implementation must not add `meta name="keywords"`. Keyword stuffing is
not part of the design.

## Metadata

The page title will communicate the product and its main user outcome. The meta
description will explain that the user uploads a CV and a job-offer link to get
an AI-assisted match report with gaps and recommendations.

The page will include:

- `meta name="description"`;
- `meta name="robots"` with `index, follow, max-image-preview:large,
  max-snippet:-1, max-video-preview:-1`;
- `link rel="canonical"`;
- `meta property="og:*"` fields for type, locale, title, description, URL and
  site name;
- `meta name="twitter:*"` fields for card, title and description.

An image-based social preview is intentionally excluded until a dedicated
share image exists. Publishing a fake or low-quality URL would create broken
previews.

## Structured Data

The HTML head will include JSON-LD for a `WebApplication`:

- name: `Radzim`;
- URL: `https://radzim.vercel.app/`;
- application category: `BusinessApplication`;
- browser operating system compatibility;
- Polish-language description;
- free `Offer` with PLN currency.

No rating or review data will be invented.

## Crawlers

`robots.txt` will allow crawling and advertise the fully-qualified sitemap URL.
`sitemap.xml` will contain the canonical landing page URL only.

## Domain Migration

After the custom domain is selected and connected to Vercel:

1. replace `https://radzim.vercel.app/` in the HTML metadata, JSON-LD,
   `robots.txt` and `sitemap.xml`;
2. configure the Vercel domain redirect so alternate hosts resolve to the
   selected canonical host;
3. submit the production sitemap in Google Search Console.

## Verification

Automated tests will verify required tags, JSON-LD fields, absence of
`meta keywords`, and consistency between canonical, robots and sitemap URLs.
Production verification will request `/`, `/robots.txt` and `/sitemap.xml`.

## References

- Google Search Central: canonical URLs:
  https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central: create robots.txt:
  https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
- Google Search Central: SoftwareApplication structured data:
  https://developers.google.com/search/docs/appearance/structured-data/software-app
