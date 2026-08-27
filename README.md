# StitchTrack: Tailor Clothing-Order Tracker

A lightweight, responsive, accessible, dependency-free browser application for managing clothing orders. StitchTrack is designed for independent tailors, dressmakers, and small bespoke fashion studios.

It is built with semantic HTML, CSS, and vanilla JavaScript without external runtime dependencies.

## 1. Project Overview

StitchTrack is an order-tracking workspace that allows independent tailors to record, monitor, update, and manage active client clothing orders in a modern web browser.

Each order contains the client’s name, clothing item, agreed price, delivery date, and production status.

Order data is stored locally in the user’s browser and is not sent to an external application server.

## 2. Target Users

StitchTrack is designed for:

- Independent tailors
- Dressmakers and seamstresses
- Bespoke fashion creators
- Home-based clothing designers
- Small fashion studios

It is intended for people who need a simple digital workspace for managing client orders without learning complicated business software.

## 3. Problem It Solves

Tailors often manage order information across paper notebooks, WhatsApp messages, physical slips, and memory.

This can lead to:

- Missed delivery deadlines
- Confusion over agreed prices and delivery details
- Difficulty tracking production stages
- Time spent searching for order information
- Lost records when physical notebooks are misplaced or damaged

StitchTrack provides one structured place for recording active clothing orders.

Orders are automatically sorted by the closest delivery date, helping the tailor see which work should receive attention first.

## 4. Core Features

- **Order Creation and Validation:** Record the client’s name, clothing item, agreed price, delivery date, and initial status with clear inline validation.
- **Delivery-Date Sorting:** Automatically display orders by the closest delivery date.
- **Atelier Work-Ticket Layout:** Present each order as a clear tailoring job slip containing the client, clothing item, price, delivery date, and status.
- **In-Card Status Updates:** Move an order between `Pending`, `In Progress`, `Ready`, and `Delivered`.
- **Deletion Confirmation:** Request confirmation before permanently deleting an order.
- **Local Persistence:** Save and restore orders with browser `localStorage`.
- **Corrupted-Storage Recovery:** Recover gracefully when stored data is missing or invalid.
- **Tailoring-Specific Empty State:** Guide the user when no orders have been created.
- **Accessible Feedback:** Use inline errors and an ARIA live region to communicate important actions.

## 5. Technologies Used

- **HTML:** Semantic elements such as `<header>`, `<main>`, `<section>`, `<form>`, `<fieldset>`, and `<button>`, together with a custom ARIA alert dialog and live regions.
- **CSS:** CSS custom properties, Grid, Flexbox, responsive media queries, focus styles, status badges, stitched accents, and tailoring-themed background motifs.
- **JavaScript:** State management, form validation, safe DOM rendering, event handling, local storage, delivery-date sorting, and Nigerian naira formatting.
- **Web Storage API:** Browser `localStorage` for saving orders between page refreshes.
- **Intl.NumberFormat:** Nigerian naira formatting using the `en-NG` locale and `NGN` currency.

No external frameworks, libraries, CDNs, fonts, databases, or APIs are used.

## 6. Development Tools

- **Antigravity:** Used as the AI-assisted development workspace for planning, implementation, review, and refinement.
- **Git:** Used to record the project’s development history through descriptive commits.
- **GitHub:** Used to host and share the public repository.
- **Local Development Server:** Used to preview the application in a standard browser environment.
- **Browser Developer Tools:** Used to inspect the interface and review responsive behaviour.

## 7. Project Structure

```text
stitch-track/
├── index.html
├── styles.css
├── script.js
├── README.md
└── journal.md
```

## 8. Running the Project Locally

### Prerequisites

You need:

- A modern web browser
- Python, if you want to use the recommended local server command

The application was developed and visually reviewed in Chrome. Complete cross-browser testing has not been performed.

### Recommended Method

Clone the repository:

```bash
git clone https://github.com/chykB/stitch-track.git
cd stitch-track
```

Start a local HTTP server:

```bash
python -m http.server 3000
```

Open this address in your browser:

```text
http://localhost:3000
```

On Windows, if the `python` command is unavailable, try:

```bash
py -m http.server 3000
```

### Alternative Method

You may open `index.html` directly in a browser.

However, `localStorage` behaviour for `file://` addresses can vary between browsers. Running the application through a local HTTP server is recommended.

## 9. Important Product and Design Decisions

### Focused Version-One Scope

The project focuses only on creating, viewing, sorting, updating, saving, and deleting clothing orders.

Authentication, databases, payments, measurements, staff accounts, online synchronization, and external APIs were intentionally excluded.

### Local Browser Storage

`localStorage` was selected because the project is a simple client-side prototype with no backend.

This allows orders to remain after a page refresh, but the data is limited to the browser and device where it was entered.

### Atelier-Inspired Visual Design

The interface is styled after a modern tailoring workspace rather than a generic administration dashboard.

The design uses:

- Warm ivory backgrounds
- Paper-like surfaces
- Deep espresso text
- Terracotta and muted brass accents
- Serif headings
- Dashed stitch dividers
- Work-ticket order cards
- Subtle tailoring-themed background motifs

### Safe DOM Rendering

User-provided order values are rendered using `textContent` and DOM creation methods instead of inserting them through `innerHTML`.

This reduces the risk of HTML injection through the order fields.

### Custom Confirmation Dialog

A custom confirmation dialog is used instead of `window.confirm()`.

This provides visual consistency and allows keyboard focus to be managed within the interface.

### Mobile-First Layout

The application uses a single-column layout on smaller screens and expands into a two-column workspace on larger screens.

Long client names and clothing descriptions wrap without creating horizontal scrolling.

## 10. Accessibility Considerations

The interface includes:

- Semantic page structure
- Visible form labels
- Labels connected to their form controls
- Inline error messages
- `aria-describedby` error associations
- Dynamic `aria-invalid` states
- An `aria-live` announcement region
- Visible keyboard-focus styles
- Keyboard support for the confirmation dialog
- Escape-key dialog dismissal
- Text labels for every status
- Minimum touch-target sizing
- Reduced-motion support
- Colour combinations designed to meet WCAG 2.1 AA contrast thresholds

A complete assistive-technology and cross-browser accessibility audit has not been performed.

## 11. Challenges and Solutions

### Empty State Appearing With Saved Orders

**Problem:** The empty-state message remained visible after orders were created because the `.empty-state` CSS display rule overrode the browser’s default handling of the `hidden` attribute.

**Solution:** A global `[hidden] { display: none !important; }` rule was added so hidden interface states are reliably removed from the rendered page.

### Date Shifts Caused by Timezones

**Problem:** Passing a date such as `2026-09-01` directly to the JavaScript `Date` constructor could display a different day in some timezones.

**Solution:** The date string is separated into year, month, and day values before formatting.

### Accessible Form Validation

**Problem:** Native browser validation messages differ between browsers and do not match the application’s design.

**Solution:** The form uses inline error containers connected to the relevant fields with `aria-describedby` and `aria-invalid`. Focus moves to the first invalid field after an unsuccessful submission.

### Corrupted Local Storage

**Problem:** Missing, malformed, or unexpected data in `localStorage` could prevent the application from loading correctly.

**Solution:** Stored data is read inside a `try...catch` block and validated before it is accepted into the application state.

### Accurate Storage Messaging

**Problem:** The original interface said orders were “safely saved,” which could suggest encrypted storage or a remote backup.

**Solution:** The wording was changed to explain that orders are saved in the current browser on the current device.

## 12. Current Limitations

- Orders do not synchronize across browsers or devices.
- Clearing browser data removes the saved orders.
- There is no cloud backup or export feature.
- The application supports one local user context.
- Prices are formatted only in Nigerian naira.
- Authentication and access control are not included.
- Deposits, outstanding balances, measurements, and client approvals are not tracked.
- The application has not received complete cross-browser or assistive-technology testing.
- The application should not be used to store highly sensitive personal information.

## 13. Possible Future Improvements

Possible improvements include:

- Exporting and importing orders as JSON or CSV
- Printable order slips
- Search and filtering
- Measurement recording
- Deposit and balance tracking
- Optional cloud synchronization
- Client approval links
- Data backup and recovery
- Broader cross-browser testing

These features are outside the scope of the current assignment.

## 14. Development Journal

The project’s planning, implementation decisions, challenges, testing, and refinements are documented in [journal.md](./journal.md).

## 15. Git Commit Approach

The project was developed through focused commits with descriptive messages, including:

- Creating the initial project structure
- Adding the responsive form and layout
- Implementing order creation and validation
- Adding local-storage persistence
- Adding status updates and deletion
- Improving accessibility and error handling
- Adding project documentation
- Refining the atelier-inspired interface

This commit history shows how the application progressed from its initial structure to the completed prototype.

## 16. Data Notice

StitchTrack stores order information in the browser’s `localStorage`.

The data:

- Is not automatically sent to an external server
- Is not encrypted by StitchTrack
- Is limited to the browser and device where it was entered
- May be removed when browser data is cleared

Do not enter highly sensitive personal or financial information into this prototype.