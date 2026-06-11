# Requirements Document

## Introduction

ClarityScale is an existing single-page marketing website for a digital growth hub / agency, currently built as a static stack of `index.html` (~706 lines), `styles.css` (~2035 lines), `script.js` (vanilla JS + GSAP via CDN), and `logo_hq.svg`. This feature migrates that site to a modern Astro + Node application written in TypeScript, while preserving the existing visual design, animations, and interactive behavior exactly.

The migration also closes a notable gap in the current site: there is no functional contact form today (the "contact" area is the footer plus `mailto:`/`tel:`/WhatsApp links). This feature introduces a real contact form backed by an Astro server endpoint with server-side validation, spam protection, and email delivery.

Secondary goals are to componentize the monolithic markup into reusable Astro components, vendor GSAP as an npm dependency (removing the CDN dependency), preserve graceful degradation when the animation library is unavailable, maintain or improve SEO/accessibility/performance, and establish a tooling baseline (build pipeline, dev server, linting, formatting, and automated tests).

## Glossary

- **ClarityScale_Site**: The migrated Astro application that renders the ClarityScale marketing website.
- **Legacy_Site**: The existing static implementation (`index.html`, `styles.css`, `script.js`, `logo_hq.svg`) used as the source of truth for visual and behavioral parity.
- **Build_System**: The Astro build pipeline that compiles the project into deployable output.
- **Node_Adapter**: The Astro adapter that enables server-side rendering and server endpoints on a Node-compatible runtime.
- **Page_Component**: An Astro component representing a discrete section of the site (for example Navbar, Hero, Services, Process, WorkPreview, Pricing, Testimonials, CTA, Footer, MobileBottomNav).
- **Design_System**: The set of CSS custom properties (color tokens, gradients, radii, shadows, transitions, typography) defined in the Legacy_Site's `styles.css`.
- **Animation_Controller**: The client-side code, using GSAP, that drives entrance animations, scroll reveals, parallax, counters, and micro-interactions.
- **Scroll_Reveal**: The behavior that progressively reveals elements marked with `data-scroll-reveal` as they enter the viewport.
- **Contact_Form**: The client-facing form through which a visitor submits a project inquiry.
- **Contact_API**: The Astro server endpoint that receives and processes Contact_Form submissions.
- **Form_Validator**: The server-side validation layer (Zod schema) that validates Contact_API payloads.
- **Spam_Filter**: The combination of honeypot field detection and rate limiting that protects the Contact_API from abuse.
- **Email_Service**: The integration (Resend or Nodemailer) that delivers Contact_Form submissions as email.
- **Submission**: A single set of data sent from the Contact_Form to the Contact_API.
- **Developer**: A person who builds, runs, tests, or maintains the ClarityScale_Site.
- **Visitor**: An end user browsing the ClarityScale_Site in a browser.

## Requirements

### Requirement 1: Astro + Node Project Scaffolding

**User Story:** As a developer, I want the site scaffolded as an Astro + Node TypeScript project, so that I have a modern build pipeline and a runtime capable of server endpoints.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL be implemented as an Astro project configured with TypeScript.
2. THE ClarityScale_Site SHALL configure a Node_Adapter that supports server-side rendering and server endpoints.
3. WHEN a developer runs the documented install command, THE Build_System SHALL install all project dependencies from a committed manifest without manual intervention.
4. WHEN a developer runs the documented development command, THE Build_System SHALL start a local development server that serves the ClarityScale_Site.
5. WHEN a developer runs the documented build command, THE Build_System SHALL produce deployable output and SHALL exit with a success status when no errors occur.
6. IF the build encounters a TypeScript type error, THEN THE Build_System SHALL report the error and SHALL exit with a non-success status.
7. THE ClarityScale_Site SHALL include GSAP as a versioned npm dependency rather than referencing GSAP from a CDN.

### Requirement 2: Component Architecture

**User Story:** As a developer, I want the monolithic HTML decomposed into Astro components, so that the site is maintainable and reusable.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL render a separate Page_Component for each of the following sections: Navigation bar, mobile drawer, Hero, trust bar, Services, Process, work-preview dashboard, Pricing, Testimonials, call-to-action, Footer, and mobile bottom navigation.
2. THE ClarityScale_Site SHALL render all sections from Requirement 2.1 on a single home page in the same vertical order as the Legacy_Site.
3. THE ClarityScale_Site SHALL define each navigable section with an element identifier matching the Legacy_Site identifiers `home`, `services`, `how-it-works`, `pricing`, `testimonials`, and `contact`.
4. THE ClarityScale_Site SHALL render the ClarityScale logo as a reusable component that is referenced by the navbar, call-to-action section, footer, and work-preview dashboard.

### Requirement 3: Visual Design Preservation

**User Story:** As a stakeholder, I want the migrated site to look identical to the existing site, so that the liked design does not regress.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL reuse the Design_System custom properties from the Legacy_Site for color tokens, gradients, radii, shadows, transitions, and typography.
2. THE ClarityScale_Site SHALL load the Syne and DM Sans font families used by the Legacy_Site.
3. THE ClarityScale_Site SHALL preserve the dark premium visual styling of every section listed in Requirement 2.1.
4. WHEN the home page is rendered at a desktop viewport width of 1280 pixels, THE ClarityScale_Site SHALL present the same section layout and ordering as the Legacy_Site.
5. WHEN the home page is rendered at a mobile viewport width of 375 pixels, THE ClarityScale_Site SHALL present the responsive layout equivalent to the Legacy_Site, including the mobile bottom navigation.

### Requirement 4: Animation System Migration

**User Story:** As a visitor, I want the same animations and micro-interactions as the original site, so that the experience feels equally polished.

#### Acceptance Criteria

1. WHEN the home page finishes loading and the Animation_Controller is available, THE ClarityScale_Site SHALL play the hero entrance animation sequence equivalent to the Legacy_Site.
2. WHILE a visitor scrolls the home page, THE Animation_Controller SHALL reveal elements marked for Scroll_Reveal as each element enters the viewport.
3. WHEN a visitor scrolls past a vertical offset of 20 pixels, THE ClarityScale_Site SHALL apply the scrolled navbar state.
4. WHEN the work-preview dashboard enters the viewport, THE Animation_Controller SHALL animate the chart bars, service breakdown fills, and KPI values equivalent to the Legacy_Site.
5. WHERE the visitor's device is a desktop pointer device, THE Animation_Controller SHALL apply the cursor glow, hero parallax, card tilt, and magnetic button micro-interactions.
6. WHEN the browser tab becomes hidden, THE Animation_Controller SHALL pause active animation timelines, and WHEN the browser tab becomes visible again, THE Animation_Controller SHALL resume the paused timelines.
7. THE ClarityScale_Site SHALL ship interactive client-side code only for sections that require it, using Astro islands rather than hydrating the entire page.

### Requirement 5: Graceful Degradation of Animations

**User Story:** As a visitor, I want the site to remain fully usable even if the animation library fails to load, so that no content becomes inaccessible.

#### Acceptance Criteria

1. IF the Animation_Controller is unavailable when the home page loads, THEN THE ClarityScale_Site SHALL reveal all Scroll_Reveal elements using an Intersection Observer fallback.
2. IF the Animation_Controller is unavailable, THEN THE ClarityScale_Site SHALL display all section content in its final visible state with no permanently hidden sections.
3. WHEN the home page loads, THE ClarityScale_Site SHALL keep Scroll_Reveal content in the document so that the content remains available to assistive technology and search crawlers regardless of animation availability.

### Requirement 6: Interactive Behavior Preservation

**User Story:** As a visitor, I want all existing interactive controls to behave the same, so that navigation and pricing exploration work as before.

#### Acceptance Criteria

1. WHEN a visitor activates the hamburger control on a mobile viewport, THE ClarityScale_Site SHALL open the mobile drawer and SHALL set the control's expanded state to true.
2. WHEN the mobile drawer is open and a visitor selects a drawer link, presses the Escape key, or activates the overlay, THE ClarityScale_Site SHALL close the mobile drawer and SHALL set the control's expanded state to false.
3. WHEN a visitor selects an in-page navigation link, THE ClarityScale_Site SHALL scroll to the target section with an offset equal to the navigation bar height.
4. WHILE a visitor scrolls through the page, THE ClarityScale_Site SHALL mark the navigation link corresponding to the currently visible section as active.
5. WHEN a visitor toggles the pricing billing control to the one-off project state, THE ClarityScale_Site SHALL display each plan's one-off price, and WHEN the control is toggled back to the monthly retainer state, THE ClarityScale_Site SHALL display each plan's monthly price.
6. WHILE a visitor scrolls on a phone viewport, THE ClarityScale_Site SHALL mark the mobile bottom navigation item corresponding to the currently visible section as active.

### Requirement 7: Contact Form (Client)

**User Story:** As a visitor, I want to submit a project inquiry through a form, so that I can contact ClarityScale without leaving the site.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL render a Contact_Form within the contact area of the home page containing a visitor name field, an email address field, and a message field.
2. THE Contact_Form SHALL mark the name field, email address field, and message field as required.
3. WHEN a visitor submits the Contact_Form with all required fields populated, THE ClarityScale_Site SHALL send the Submission to the Contact_API.
4. WHILE a Submission is being processed by the Contact_API, THE Contact_Form SHALL display an in-progress state and SHALL prevent duplicate submissions.
5. WHEN the Contact_API returns a success response, THE Contact_Form SHALL display a confirmation message to the visitor.
6. IF the Contact_API returns an error response, THEN THE Contact_Form SHALL display an error message and SHALL allow the visitor to resubmit.
7. WHERE the Animation_Controller is unavailable, THE Contact_Form SHALL remain fully operable for submitting a Submission.

### Requirement 8: Contact API and Server-Side Validation

**User Story:** As a developer, I want the contact endpoint to validate input on the server, so that only well-formed submissions are accepted and processed.

#### Acceptance Criteria

1. THE Contact_API SHALL be implemented as an Astro server endpoint that accepts HTTP POST requests.
2. WHEN the Contact_API receives a Submission, THE Form_Validator SHALL validate the payload against a Zod schema requiring a non-empty name, a syntactically valid email address, and a non-empty message.
3. IF a Submission fails Form_Validator validation, THEN THE Contact_API SHALL respond with a 400 status and a response body identifying the invalid fields.
4. WHEN a Submission passes Form_Validator validation and all downstream processing succeeds, THE Contact_API SHALL respond with a 200 status.
5. IF the Contact_API receives a request using an HTTP method other than POST, THEN THE Contact_API SHALL respond with a 405 status.
6. THE Form_Validator SHALL enforce a maximum length on the name field, email address field, and message field to bound payload size.
7. THE Contact_API SHALL treat all incoming Submission data as untrusted and SHALL sanitize submitted values before including them in any outgoing email.

### Requirement 9: Spam Protection

**User Story:** As a site owner, I want the contact endpoint protected against spam and abuse, so that the inbox is not flooded with automated submissions.

#### Acceptance Criteria

1. THE Contact_Form SHALL include a honeypot field that is hidden from visitors.
2. IF a Submission arrives with a populated honeypot field, THEN THE Contact_API SHALL reject the Submission and SHALL respond with a success status without sending an email.
3. WHEN the number of Submissions received from a single client identifier exceeds the configured limit within the configured time window, THE Contact_API SHALL reject further Submissions from that client identifier with a 429 status until the time window elapses.
4. WHEN the Contact_API rejects a Submission as spam, THE Contact_API SHALL omit calling the Email_Service for that Submission.

### Requirement 10: Email Delivery

**User Story:** As a site owner, I want valid submissions delivered to my inbox by email, so that I receive and can respond to project inquiries.

#### Acceptance Criteria

1. WHEN a Submission passes validation and spam checks, THE Email_Service SHALL send an email containing the submitted name, email address, and message to the configured recipient address.
2. THE Email_Service SHALL read its credentials and the recipient address from environment configuration rather than from source code.
3. IF the Email_Service fails to send an email, THEN THE Contact_API SHALL respond with a 502 status and SHALL log the failure.
4. WHERE required Email_Service configuration is absent at startup, THE ClarityScale_Site SHALL surface a configuration error to the developer rather than silently disabling email delivery.

### Requirement 11: SEO

**User Story:** As a site owner, I want the migrated site to maintain or improve search visibility, so that organic traffic is not lost in the migration.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL render a page title and meta description equivalent to the Legacy_Site.
2. THE ClarityScale_Site SHALL render Open Graph metadata including title, description, and type.
3. THE Build_System SHALL generate a sitemap for the ClarityScale_Site at build time.
4. THE ClarityScale_Site SHALL render a single top-level heading on the home page and SHALL preserve a descending heading hierarchy across sections.

### Requirement 12: Accessibility

**User Story:** As a visitor using assistive technology, I want the site to be accessible, so that I can navigate and use it effectively.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL preserve the landmark roles and accessible names present in the Legacy_Site for the navigation, dialog, and contentinfo regions.
2. WHEN the mobile drawer is open, THE ClarityScale_Site SHALL expose its expanded state through the controlling element's `aria-expanded` attribute.
3. THE Contact_Form SHALL associate a programmatic label with each visitor-facing input field.
4. WHEN a Contact_Form validation error is displayed, THE Contact_Form SHALL associate the error message with its corresponding field for assistive technology.
5. WHERE a visitor has enabled a reduced-motion preference, THE Animation_Controller SHALL reduce or suppress non-essential motion.

### Requirement 13: Performance

**User Story:** As a visitor, I want the site to load quickly, so that I have a fast and smooth experience.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL pre-render static section markup at build time so that initial content is served without requiring client-side JavaScript to render.
2. THE ClarityScale_Site SHALL defer loading of the Animation_Controller until after first paint of the home page.
3. THE ClarityScale_Site SHALL serve the ClarityScale logo and decorative SVG assets as inline or static assets without external CDN dependencies.

### Requirement 14: Tooling

**User Story:** As a developer, I want linting and formatting configured, so that code quality and style stay consistent.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL include an ESLint configuration covering the project's TypeScript and Astro source files.
2. THE ClarityScale_Site SHALL include a Prettier configuration for code formatting.
3. WHEN a developer runs the documented lint command, THE Build_System SHALL report lint findings and SHALL exit with a non-success status when lint errors are present.
4. THE ClarityScale_Site SHALL provide documented scripts for installing, developing, building, linting, and testing the project.

### Requirement 15: Automated Testing

**User Story:** As a developer, I want unit and end-to-end tests, so that migration regressions and contact-flow failures are caught automatically.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL include Vitest unit tests covering the Form_Validator schema for valid and invalid Submissions.
2. THE ClarityScale_Site SHALL include Vitest unit tests covering Spam_Filter honeypot detection and rate-limit enforcement.
3. THE ClarityScale_Site SHALL include a Playwright end-to-end test that submits the Contact_Form and asserts that a confirmation message is displayed when the Contact_API succeeds.
4. THE ClarityScale_Site SHALL include a Playwright end-to-end test asserting that all home page sections render and that in-page navigation scrolls to the corresponding section.
5. WHEN a developer runs the documented test command, THE Build_System SHALL execute the test suite in a single non-watch run and SHALL exit with a non-success status when any test fails.

### Requirement 16: Content and Asset Parity

**User Story:** As a stakeholder, I want all existing content and contact channels carried over, so that no information is lost in the migration.

#### Acceptance Criteria

1. THE ClarityScale_Site SHALL reproduce the textual content of the Legacy_Site for the hero, services, process, pricing, testimonials, and footer sections.
2. THE ClarityScale_Site SHALL preserve the Legacy_Site external contact links for email, telephone, WhatsApp, and Instagram.
3. THE ClarityScale_Site SHALL preserve the Legacy_Site pricing plan names, descriptions, feature lists, and the monthly and one-off price values for each plan.
