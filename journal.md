# Development Journal: StitchTrack

This journal records the main work, decisions, challenges, and lessons from building the StitchTrack clothing-order tracker.

## Entry 1: Planning and Project Scope

### What I worked on

I defined the project as a simple clothing-order tracker for independent tailors, dressmakers, and small fashion studios.

The first version needed to allow a user to record a client’s name, clothing item, agreed price, delivery date, and order status. It also needed to display saved orders, update their status, delete them, and preserve them after a browser refresh.

### Decisions made

I decided to use semantic HTML, CSS, and vanilla JavaScript. I excluded authentication, databases, online payments, external APIs, inventory, measurements, and staff management.

The purpose of this project was to build and document a small working application, not to recreate my complete commercial product idea.

### Challenge and response

The main planning challenge was preventing the project from becoming too large. Several additional features sounded useful, but they were not required to demonstrate the core order-tracking workflow.

I kept a written list of excluded features and treated them as possible future improvements.

### Next step

Create the project structure and build the order form.

## Entry 2: Interface and Form

### What I worked on

I created the initial project files:

- `index.html`
- `styles.css`
- `script.js`
- `README.md`
- `journal.md`

I built a form containing the client name, clothing item, agreed price, delivery date, and initial status.

I connected visible labels to the form controls and added dedicated containers for validation messages.

### Decisions made

I used a mobile-first layout so the application would remain practical on smaller screens.

I also chose system fonts and inline SVG icons instead of external fonts or icon libraries. This kept the project dependency-free.

### Challenge and response

I needed validation messages that were clear without relying on browser alerts.

I used inline error messages associated with their fields through `aria-describedby`. Invalid fields receive `aria-invalid="true"`, and focus moves to the first field that requires correction.

### Next step

Implement order creation, display, validation, and browser storage.

## Entry 3: Core Application Functionality

### What I worked on

I added the JavaScript required to create and display orders.

Each order receives a unique ID and is displayed with the client name, clothing item, agreed price, delivery date, and current status.

Orders are sorted by the closest delivery date. Prices are formatted in Nigerian naira using `Intl.NumberFormat`.

I also added status updates and order deletion with a confirmation dialog.

### Decisions made

I used `localStorage` because the assignment required a simple browser-based application without a backend.

User-provided values are displayed with `textContent` and DOM creation methods instead of being inserted through `innerHTML`.

I used a custom confirmation dialog for deletion so the interface could provide consistent styling and managed keyboard focus.

### Challenge and response

JavaScript date parsing could display a delivery date one day earlier in some timezones.

To avoid this, I separated the stored date into year, month, and day values before formatting it for display.

I also added error handling so invalid or corrupted localStorage data would not prevent the application from loading.

### Next step

Review accessibility, keyboard interaction, empty states, and error handling.

## Entry 4: Accessibility and Functional Review

### What I worked on

I reviewed the application’s labels, focus styles, validation messages, status indicators, dialog behaviour, and live announcements.

I added keyboard support for opening and closing the deletion dialog, trapping focus inside it, and restoring focus after it closes.

Status is always communicated through text, not colour alone. I also included visible focus styles and reduced-motion support.

Temporary Node.js scripts were used to check the project structure, validation logic, sorting, localStorage recovery, status changes, deletion, and safe rendering of user-entered text.

### Decisions made

I documented the boundaries of the testing honestly.

The automated checks used a simulated DOM environment. They were not complete live-browser, screen-reader, or cross-browser tests. The interface was visually reviewed in Chrome, but complete assistive-technology testing remains outside this project’s current scope.

### Challenge and response

Live automated browser testing could not be completed because the browser-testing tool failed to download its required driver.

Instead of describing code inspection as full browser verification, I recorded which checks were automated, which were visually reviewed, and which remain untested.

### Next step

Test the populated interface and review whether the visual design reflects the intended users.

## Entry 5: Empty-State Bug and Visual Redesign

### What I worked on

After adding sample orders, I discovered that the page displayed the order cards and the “No orders recorded yet” message at the same time.

The JavaScript correctly added the `hidden` attribute to the empty state. However, the `.empty-state { display: flex; }` CSS rule overrode the browser’s default hidden styling.

I corrected this by adding:

`[hidden] { display: none !important; }`

I then reviewed the visual design. The first interface was functional but looked like a general administration dashboard rather than a tailoring workspace.

I redesigned it with an atelier-inspired style using warm ivory surfaces, dark text, terracotta and muted brass accents, serif headings, stitched divider lines, and work-ticket order cards.

### Decisions made

I kept the tailoring theme restrained so that decoration would not compete with order information.

I later added a few faint outline illustrations of tailoring tools to the page background. These decorative SVGs are non-interactive, hidden from assistive technology, and reduced on smaller screens.

### Challenge and response

The biggest lesson from the empty-state bug was that correct JavaScript state does not guarantee correct visual output. The DOM simulation confirmed that the `hidden` attribute existed, but it did not reveal that CSS was overriding the rendered result.

A real screenshot of the populated interface exposed the problem.

### Next step

Review the final copy, documentation, repository status, and submission requirements.

## Entry 6: Documentation and Final Preparation

### What I worked on

I updated the README to explain:

- What StitchTrack is
- Who it is designed for
- The problem it addresses
- Its core features
- Technologies and tools used
- How to run it locally
- Important product and design decisions
- Challenges and solutions
- Current limitations
- Possible future improvements

I also corrected wording that overstated the safety of browser storage. The interface now explains that orders are saved in the current browser on the current device.

### Decisions made

I documented localStorage as a limitation rather than presenting it as secure backup or cloud storage.

I also kept the public documentation focused on what the application currently does. Features such as measurements, deposits, client approvals, cloud synchronization, and data export remain possible future improvements.

### Final reflection

This project showed me that building a functional interface is only one part of product engineering.

I also had to control the scope, consider the user’s workflow, test assumptions, identify misleading wording, review accessibility, respond to a real rendering bug, and document the reasons behind my decisions.

The final application remains intentionally small, but its code, design, Git history, README, and journal show how it progressed from a basic prompt into a working prototype.

### Submission status

Before submitting, I will confirm that:

- The repository is public.
- The latest changes are committed and pushed.
- `README.md` and `journal.md` are present.
- The repository link opens correctly.
- The direct GitHub repository link is entered in the designated submission field.