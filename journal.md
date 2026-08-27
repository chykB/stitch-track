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
  - Accessible dialog-pattern confirmation overlay for destructive order deletion actions with ARIA modal attributes.
  - Global screen reader live region (`#live-announcer`) for real-time operation announcements.
  - Empty state container explaining how to record the tailor's first order.

### Decisions Made
- **Zero External Dependencies**: Decided to use pure SVG vectors and native HTML5 elements rather than CDN font libraries or icons to guarantee offline availability and privacy.
- **Accessible Validation Architecture**: Paired all inputs with `aria-required="true"` and `aria-describedby` pointing directly to error containers so assistive technologies announce contextual errors immediately.
- **Modal Confirmation Over `window.confirm`**: Designed an accessible dialog container in HTML so confirmation can be operated with full keyboard trapping, readable typography, and visual consistency across browsers without blocking JavaScript execution.

### Challenges Encountered
- Ensuring that native HTML validation does not trigger default unstyled browser popups while still keeping semantics accessible.

### How the Challenges Were Handled
- Added the `novalidate` attribute to `<form>` so our custom, accessible, inline validation system can control user feedback precisely without jarring native browser alert bubbles.

### What Should Happen Next
- **Stage 2**: Build out the comprehensive responsive visual design and design system in `styles.css`.

---

## Stage 2: Responsive Visual Design

### What Was Completed
- Built the complete CSS design system using CSS Custom Properties (Tokens) for consistent palette, typography, radii, elevation shadows, and transitions.
- Designed an artisan-tailor theme:
  - Background: Warm natural workshop tone (`#f7f5f0`).
  - Text: High-contrast rich charcoal (`#1c1a17`) with secondary warm slate (`#5a544b`).
  - Accent: Single restrained warm terracotta / tailor bronze (`#a84b16`) for primary focus, highlights, and primary actions.
  - Status badges: Distinct color pairings (Pending: Amber, In Progress: Indigo/Blue, Ready: Emerald/Green, Delivered: Charcoal/Gray), each with a visible shape indicator and clear text representation.
- Implemented mobile-first responsive architecture:
  - Mobile layout: Fluid single-column with ample touch targets (minimum 44px for buttons and inputs).
  - Tablet/Desktop layout: 2-column workspace with a sticky order creation form panel and responsive auto-fill grid of cards.
- Implemented `:focus-visible` ring styling and high contrast borders to ensure clear keyboard navigation.
- Included `prefers-reduced-motion` media query to respect users' vestibular motion preferences.

### Decisions Made
- **Avoided Frameworks and External CDNs**: Used native CSS Grid, Flexbox, and custom properties for fast performance and zero network dependencies.
- **Accessible Touch Target Sizes**: Standardized all clickable controls (buttons, inputs, selects) to 44px+ touch targets on mobile viewports.
- **Visual Status Redundancy**: Paired status badge background colors with solid border outlines, a small status dot indicator, and unambiguous textual labels to prevent reliance on color alone.

### Challenges Encountered
- Ensuring desktop stickiness of the form panel without causing scrolling overflow issues on short laptop screens.

### How the Challenges Were Handled
- Used `position: sticky; top: var(--space-6); align-items: start;` on the CSS Grid layout, ensuring the form panel remains anchored while the orders feed scrolls naturally.

### What Should Happen Next
- **Stage 3**: Implement order creation and field-level validation logic in `script.js`.

---

## Stage 3: Order Creation and Validation

### What Was Completed
- Implemented non-blocking field validation logic in `script.js`:
  - **Client Name**: Must not be empty or whitespace only.
  - **Clothing Item**: Must not be empty or whitespace only.
  - **Agreed Price**: Must be a valid positive numerical amount strictly greater than 0.
  - **Delivery Date**: Must be selected and valid.
- Built accessible error display mechanisms:
  - Toggled `aria-invalid="true|false"` dynamically on the input elements.
  - Rendered inline error messages directly into `#<field>-error` nodes without using browser alerts.
  - Added real-time `input` event listeners on all form controls to clear error states as soon as the user corrects their input.
- Added programmatic focus management to send focus to the first invalid field upon form submission failure.
- Implemented utility functions for unique ID generation (`ord_<timestamp>_<random>`) and Nigerian Naira currency formatting (`Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`).

### Decisions Made
- **Real-Time Error Clearing**: Rather than waiting for another submit click, clearing error states on typing provides immediate feedback and reduces tailor frustration when entering rapid orders.
- **Strict Number and Whitespace Sanitization**: Added `.trim()` checks and `parseFloat() > 0` validation to prevent whitespace-only client entries or negative price anomalies.

### Challenges Encountered
- Ensuring that screen readers announce the exact reason a form failed validation when navigating directly to the first invalid input.

### How the Challenges Were Handled
- Connected each input to its dedicated error container with `aria-describedby` and marked the error container with `role="alert"` so assistive technology reads the error text as soon as the field is focused.

### What Should Happen Next
- **Stage 4**: Implement order rendering, delivery-date ascending sorting, empty state management, and `localStorage` persistence with error recovery.

---

## Stage 4: Order Persistence with localStorage

### What Was Completed
- Created defensive `localStorage` loading and saving layer under key `stitchtrack_orders_v1`.
- Built data sanity validation inside `loadOrdersFromStorage()` to handle missing, empty, or corrupt data without throwing runtime exceptions.
- Implemented ascending delivery date sorting (`sortOrders()`) ensuring orders due earliest are shown at the top of the feed, with creation timestamps as tiebreakers.
- Implemented safe DOM rendering in `createOrderCardElement()` and `renderOrders()` using `document.createElement`, `textContent`, and `setAttribute`, strictly avoiding `innerHTML` interpolation of user-supplied text.
- Integrated Nigerian Naira currency formatting via `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
- Handled dynamic empty state toggling when no active orders exist.

### Decisions Made
- **Zero innerHTML Interpolation**: Ensured user input fields (`clientName`, `clothingItem`, `price`, `date`) are safely bound via `textContent` to prevent script injection.
- **Defensive Storage Schema Verification**: When loading from storage, each record is validated against field types and expected status values to prevent app crashes if localStorage was tampered with or corrupted.

### Challenges Encountered
- Preserving local date values without timezone conversion shifts (e.g., date input string `"2026-09-15"` turning into previous day in certain timezones if parsed via standard `new Date(string)`).

### How the Challenges Were Handled
- Deconstructed the date string into explicit year, month, and day components before parsing, ensuring identical presentation across timezones.

### What Should Happen Next
- **Stage 5**: Verify and refine status updates and deletion workflows with accessible confirmation modals.

---

## Stage 5: Status Updates and Order Deletion

### What Was Completed
- Added immediate status updating capabilities directly from individual order cards:
  - Interactive `<select>` elements dynamically linked to order state.
  - Status updates update the UI badge immediately, synchronize localStorage, and emit an `aria-live` announcement.
- Implemented accessible confirmation workflow for order deletions:
  - Custom confirmation modal (`role="alertdialog"`, `aria-modal="true"`).
  - Dynamically populates the client's name in the warning description.
  - Keyboard trapping (Tab / Shift+Tab cycling) between Cancel and Delete buttons.
  - Dismissal support via Escape key or clicking outside the modal.
  - Focus retention: When deletion is cancelled, focus is restored to the specific "Delete Order" trigger button that opened it.

### Decisions Made
- **Non-blocking Custom Modal vs. Native Alert**: Native browser `confirm()` freezes the JavaScript thread and is visually inconsistent. A semantic custom dialog provides a superior UX, preserves accessibility landmarks, and allows custom keyboard management.
- **Immediate State Synchronization**: Updating status immediately rewrites the state and `localStorage` record without requiring an extra "Save" button per card.

### Challenges Encountered
- Avoiding focus loss when closing the confirmation modal or removing a deleted card from the DOM.

### How the Challenges Were Handled
- Saved `state.lastFocusedElementBeforeDialog` upon opening the modal and restored focus to that element on cancellation.

### What Should Happen Next
- **Stage 6**: Conduct accessibility review, verify color contrast calculations, and test edge cases.

---

## Stage 6: Improved Accessibility and Error Handling

### What Was Completed
- **Screen Reader Announcements**: Configured live ARIA announcements via `#live-announcer` for order creation, status changes, deletions, and storage warnings.
- **Accessible Validation Linking**: Connected form controls directly to contextual error text nodes via `aria-describedby` and synchronized `aria-invalid` boolean states.
- **Focus Management**:
  - Automatically moves focus to the first invalid field upon rejected form submission.
  - Automatically traps focus inside the deletion dialog modal.
  - Returns focus to the trigger button if deletion is cancelled.
- **Defensive Error Handling**:
  - Sanitized `localStorage` deserialization with fallback to an empty array upon JSON parsing syntax errors or malformed array structures.
  - Filtered incoming storage records against strict type predicates (string IDs, positive numeric prices, valid ISO dates, allowed status enums).
  - Rendered user values via `textContent` to reduce HTML injection risks.
- **Contrast & Motion Support**:
  - Calculated color pair luminance against WCAG 2.1 AA target thresholds (4.5:1 for normal text).
  - Included `prefers-reduced-motion` CSS overrides to suppress transitions for users sensitive to motion.

### Decisions Made
- **Textual + Visual Status Indicators**: Implemented text labels alongside color badges and dot glyphs to ensure status information is accessible without relying on color alone.
- **Keyboard Tab-Loop Trapping**: Used native keydown listener to cycle focus between Cancel and Delete in the dialog, preventing background tab leaks.

### Challenges Encountered
- Screen readers occasionally suppressing rapid successive announcements if identical text was sent to `aria-live` containers.

### How the Challenges Were Handled
- Cleared `DOM.liveAnnouncer.textContent` before injecting new announcement text with a 50ms setTimeout deferral to allow screen readers to register content updates.

### What Should Happen Next
- **Stage 7**: Perform automated test checks.

---

## Stage 7: Initial Automated Code & Token Checks

### What Was Completed
- Created an automated verification script (`test_runner.js` in the scratch directory) that ran 30 programmatic assertion checks covering:
  - File existence and project structure adherence.
  - HTML markup presence for input fields, labels, live regions, and dialog.
  - CSS custom properties, responsive rule definitions, and reduced-motion queries.
  - Currency formatting output for Nigerian Naira.
  - Sorting comparator logic (date ascending with creation time tiebreaker).
  - Storage error recovery handling (corrupt JSON, non-array payloads).
  - Safe DOM method presence (`textContent`, `createElement`).
- Executed the 30 structural/unit assertions successfully.

### Distinction from Later Functional Testing
- This initial 30-check suite tested individual static code units, string patterns, and isolated utility functions in Node.js. It did not simulate sequential end-to-end user workflows (e.g. form submission flows, multi-order deletion sequences, or modal focus shifts), which were tested in Stage 9.

### Challenges Encountered
- Browser-based automated testing using Playwright could not be initialized due to a remote driver download 404 network failure in the sandboxed environment.

### How the Challenges Were Handled
- Replaced direct browser automation with Node.js script assertions testing DOM manipulation methods and state transformations.

### What Should Happen Next
- **Stage 8**: Complete project documentation and development journal.

---

## Stage 8: Project Documentation and Review

### What Was Completed
- Authored `README.md` covering:
  - Project summary, target audience, and problem solved for independent tailors.
  - Core features and technologies used.
  - Local execution instructions via Python HTTP server.
  - Architectural, design, and accessibility decisions.
  - Resolved challenges and current limitations.
- Finalized this development journal (`journal.md`).

### Decisions Made
- **Honest Documentation**: Documented actual storage characteristics (browser-bound `localStorage`) and provided setup instructions.

### What Should Happen Next
- Perform comprehensive self-audit and quality verification.

---

## Stage 9: Comprehensive Self-Audit & Functional Verification

### What Was Completed
- Executed a 24-scenario functional test harness (`audit_suite.js` in the scratch directory) using a Node.js DOM-simulation environment.
- Verified all 24 explicit functional scenarios:
  - Empty state and zero count initialization.
  - Form validation on empty inputs, whitespace-only names/items, zero price, negative price, and missing date.
  - Order creation, immediate rendering, empty state hiding, and singular counter ("1 Order").
  - Multi-order ascending delivery date sorting with tiebreaker handling.
  - Status updates and persistence across simulated reload.
  - Deletion modal opening, cancellation preserving order, confirmation deleting order, and complete deletion restoring empty state.
  - Safe rendering of HTML strings (e.g. `<strong>Test</strong>`) as literal text.
  - Corrupted localStorage graceful recovery.
  - Singular and plural count progression ("0 Orders", "1 Order", "2 Orders").
- Updated header copy in `index.html` to accurately state: `"Your orders are saved in this browser on this device."`

### Verification Boundaries & Clarifications
- **Harness Scope**: Tests were executed using a temporary Node.js DOM-simulation script (`audit_suite.js`). Tests were **not** executed in a live Chromium, Firefox, Safari, or WebKit browser.
- **Responsive Design**: Responsive CSS rules and media queries (640px, 900px, 1100px) were inspected via code review; live interactive verification across every individual physical viewport size was not performed.
- **Accessibility**: Programmatic attributes (`aria-describedby`, `aria-invalid`, `aria-live`, `role="alertdialog"`, focus traps, focus restoration, label associations, `:focus-visible`) and mathematical color contrast ratios were verified through code inspection and programmatic assertions. Full assistive-technology audits with live screen readers (NVDA, JAWS, VoiceOver) and a complete formal WCAG 2.1 AA audit were not performed.

---

## Stage 10: Final Evidence-Alignment Pass & Focus Improvements

### What Was Completed
- **Improved Deletion Focus Management**:
  - Updated `confirmDeleteOrder()` in `script.js`:
    - When other orders remain after a deletion, focus is moved to the `#orders-heading` ("Saved Orders") landmark.
    - When the final remaining order is deleted, focus is moved to the `#empty-state` container.
  - Added `tabindex="-1"` to both `#orders-heading` and `#empty-state` in `index.html` so they can receive programmatic focus without entering the default tab order.
  - Added `[tabindex="-1"]:focus:not(:focus-visible) { outline: none; }` and `[tabindex="-1"]:focus-visible` rules in `styles.css`.
- **Refined Documentation Language in `README.md`**:
  - Replaced "offline-first" with "dependency-free, browser-based."
  - Replaced "Safe DOM Injection" with "Safe DOM Rendering."
  - Clarified XSS wording: "User-provided order values are rendered through textContent, reducing the risk of HTML injection through those fields."
  - Replaced "Non-Modal Confirmation Dialog" with "Custom Modal Confirmation Dialog."
  - Clarified accessibility scope: "The interface includes accessibility considerations such as semantic labels, inline error associations, keyboard handlers, visible focus styles, status text, reduced-motion support, and contrast ratios designed to meet WCAG 2.1 AA thresholds. A complete assistive-technology audit has not been performed."
  - Updated local run instructions to recommend `python -m http.server 3000` with direct file opening noted as an alternative.
- **Code Quality & Formatting**:
  - Removed trailing blank lines to ensure clean `git diff --check` output.
- **Retesting**:
  - Re-executed the functional test suite against the updated codebase. All tests passed cleanly.

### What Should Happen Next
- Review git status and await user authorization before pushing to GitHub.

---

## Stage 11: Atelier Visual Redesign & Critical Empty-State Bug Fix

### What Was Completed
- **Critical Empty-State Display Bug Resolved**:
  - *Identified Defect*: In populated states, the empty state ("No orders recorded yet") remained visible alongside active order cards.
  - *Root Cause*: `.empty-state { display: flex; }` had higher specificity than the browser's default user-agent `[hidden]` rule, overriding `display: none` when the `hidden` attribute was set by JavaScript.
  - *Correction*: Added a global CSS rule `[hidden] { display: none !important; }` at the top of `styles.css`. Now, any element with the `hidden` attribute is strictly removed from layout.
- **Atelier Visual Redesign Implemented**:
  - Replaced generic SaaS dashboard aesthetics with a warm, crafted atelier visual language tailored for independent fashion designers.
  - Applied the refined palette: Warm ivory canvas (`#F7F1E7`), paper surfaces (`#FFFCF7`), deep espresso text (`#2A211B`), terracotta accents (`#A94F2B`), and soft thread borders (`#D8C5AD`).
  - Integrated system font pairings: Classic `Georgia` serif for brand titles and section headers ("Create an Order", "Order Board"), paired with a crisp sans-serif for inputs, badges, and controls.
  - Redesigned order cards to resemble atelier work tickets with stitched terracotta left borders, dashed dividers, and clear hierarchy.
  - Replaced the generic shopping bag empty state with a bespoke tailor spool & thread vector motif.
- **Documentation & Evidence Alignment**:
  - Updated `README.md` and `journal.md` reflecting the new visual system, bug resolution, and honest testing status.

### Decisions Made
- **System Typography over CDN Fonts**: Leveraged system `Georgia` for artisanal character without introducing network latency or external font dependencies.
- **CSS-Only Linen Texture**: Added a subtle radial dot weave pattern in CSS to evoke a natural fabric texture.

### Testing & Verification Status
- **Automated / Headless Verification**: Re-executed the 24-scenario test harness with 100% pass rate, validating that `hidden` toggles properly and focus routing operates as intended.
- **Live Browser Testing Note**: Live automated visual rendering via Playwright remained unavailable due to environment driver download constraints (404 on Playwright Azure CDN). The CSS specificity fix and DOM structures were validated via code inspection and headless DOM evaluation. Live assistive screen reader and multi-browser rendering remain manual verification tasks for the user.
