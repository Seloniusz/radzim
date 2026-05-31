# Wero-Inspired Editorial Redesign

## Goal

Replace the current generic dashboard styling with a distinctive editorial interface inspired by the visual language of Sowieso Wero while preserving Radzim's existing workflow and structured analysis output.

## Visual Direction

Use a single warm page gradient from pink through peach to yellow. Use black typography, flat surfaces, thick black outlines, generous rounded corners, and restrained neon accents. Avoid purple gradients, soft shadows, dark terminal panels, and generic dashboard cards.

The reference is used as inspiration, not copied as a page layout.

## Application Shell

- Add a compact `radzim.` wordmark and a small system label.
- Use a large, tightly tracked headline with a neon green inline highlight.
- Keep the upload workflow in a flat off-white panel with a black border.
- Style inputs and upload area with black outlines and visible focus states.
- Use a black submit button with an offset neon accent.

## Loading State

Replace the circular spinner with a five-segment loading bar. Keep the status copy concise and visually aligned with the editorial system.

## Results

Retain the two-column desktop report and one-column mobile layout.

- Use off-white panels with black outlines.
- Render the score in a yellow circular badge with a black outline.
- Keep `x/5` competency bars with black outlines and neon green active segments.
- Use cyan keyword tags.
- Use neon green for verified strengths, pink for gaps, and yellow for actions.
- Preserve semantic headings, lists, safe links, and existing dynamic data.

## Responsive Behavior

Below `760px`, stack all report sections into one column. Keep large headings readable, prevent horizontal overflow, and allow keyword tags to wrap.

## Testing

- Add source-level assertions that reject legacy purple and dark terminal styling.
- Verify the new editorial tokens, segmented loader, and report panel classes.
- Run existing renderer tests.
- Inspect local desktop and mobile layouts in Browser.
- Deploy and run a production API smoke test.
