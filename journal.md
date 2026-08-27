# Development Journal: StitchTrack Clothing-Order Tracker

An honest, stage-by-stage record of the design, architectural decisions, challenges, and solutions during development.

---

## Stage 1: Project Structure and Semantic HTML

### What Was Completed
- Created the project directory structure with discrete files (`index.html`, `styles.css`, `script.js`, `README.md`, and `journal.md`).
- Authored the complete semantic HTML5 document:
  - Accessible page header with a bespoke pure-SVG tailoring brand mark (no external icon dependencies).
  - Two-panel responsive container (`.form-section` and `.orders-section`).
  - Comprehensive `<form>` with visible `<label>` tags linked to form inputs via `for` and `id` attributes.
  - Dedicated field error containers (`div.field-error`) equipped with `role="alert"` and `aria-live="polite"` linked to each control via `aria-describedby`.
  - Accessible `<dialog>`-pattern confirmation overlay for destructive order deletion actions with ARIA modal attributes.
  - Global screen reader live region (`#live-announcer`) for real-time operation announcements.
  - Empty state container explaining how to record the tailor's first order.

### Decisions Made
- **Zero External Dependencies**: Decided to use pure SVG vectors and native HTML5 elements rather than CDN font libraries or icons to guarantee 100% offline availability and privacy.
- **Accessible Validation Architecture**: Paired all inputs with `aria-required="true"` and `aria-describedby` pointing directly to error containers so assistive technologies announce contextual errors immediately.
- **Modal Confirmation Over `window.confirm`**: Designed an accessible dialog container in HTML so confirmation can be operated with full keyboard trapping, readable typography, and visual consistency across browsers without blocking JavaScript execution.

### Challenges Encountered
- Ensuring that native HTML validation does not trigger default unstyled browser popups while still keeping semantics fully accessible.

### How the Challenges Were Handled
- Added the `novalidate` attribute to `<form>` so our custom, accessible, inline validation system can control user feedback precisely without jarring native browser alert bubbles.

### What Should Happen Next
- **Stage 2**: Build out the comprehensive responsive visual design and design system in `styles.css` (mobile-first layout, atelier warm theme, status badge colorways, button states, focus rings, and card styles).
