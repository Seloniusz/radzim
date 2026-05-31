# CLI Analysis Dashboard Design

## Goal

Replace the raw JSON analysis output with a readable CV matching dashboard. Keep the current modern upload form. Present results as a light analytical interface with a dark CLI-style competency panel.

## Scope

The existing single-page frontend remains in `index.html`. The API continues to return JSON serialized as the `analysis` field. The change adds dynamic competency ratings and a frontend renderer. No framework migration is required.

## API Contract

The model response must retain:

- `matchPercentage`: number from 0 to 100
- `whatWorks`: array of strings
- `whatsMissing`: array of strings
- `concreteChanges`: array of strings
- `keywords`: array of `{ term, url }`

The response adds:

- `skillRatings`: array of 4 to 6 `{ label, score }` entries
- `label`: short competency name relevant to the analyzed job offer
- `score`: integer from 1 to 5 representing CV evidence for that competency

Examples for a QA offer: `Testy manualne`, `API + SQL`, `Automatyzacja`, `CI/CD`. Categories must be selected dynamically by the model and must not be hard-coded in the frontend.

## Report Layout

The report uses a two-column desktop dashboard:

- Header: report title, short CLI-style label, and large percentage score.
- Left column: dark competency panel with `x/5` ratings and five-segment bars. Keyword source links appear below as compact tags.
- Right column: three readable cards: `Mocne strony`, `Luki do uzupełnienia`, and `Następne kroki`.
- Footer action: analyze another CV.

The interface uses a light neutral page background, dark green terminal panel, green accent, and monospace labels. Body text remains readable and restrained.

## Responsive Behavior

Below the mobile breakpoint, the report becomes one column:

1. Header and percentage score
2. Competency bars
3. Keyword links
4. Strengths
5. Gaps
6. Next steps
7. Reset action

No horizontal scrolling is required.

## Error Handling

- The backend validates `skillRatings` when present.
- The frontend parses the serialized JSON instead of showing it directly.
- If `skillRatings` is absent or empty, the report still renders the percentage, lists, and keyword links without the competency panel.
- Invalid serialized JSON is handled through the existing error surface and never displayed as raw content.
- Keyword URLs are rendered only as safe HTTP or HTTPS links.

## Testing

- Backend tests verify normalization and validation of valid and invalid `skillRatings`.
- Frontend renderer tests verify that structured analysis produces percentage output, competency bars, cards, and keyword links without raw JSON.
- Browser verification covers desktop layout and mobile stacking.
- A production analysis request verifies that the deployed endpoint returns the extended structured response.
