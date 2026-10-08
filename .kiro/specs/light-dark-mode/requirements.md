# Requirements Document

## Introduction

The Life Dashboard web application includes a Light/Dark Mode feature that lets users switch between a light and a dark color scheme. A basic implementation already exists: the toggle button (`#theme-toggle`) swaps a `data-theme` attribute on `<html>`, the chosen theme is stored in `localStorage` under the key `ld_theme`, and CSS custom properties handle the visual change.

This requirements document formalises the complete feature — covering toggle interaction, system preference detection and live synchronisation, WCAG 2.1 AA color-contrast compliance, accessible labelling of the toggle button, smooth transition animation, and graceful degradation when `localStorage` is unavailable.

---

## Glossary

- **Dashboard**: The Life Dashboard single-page web application.
- **Theme_Controller**: The JavaScript module responsible for reading, applying, and persisting the active theme.
- **Toggle_Button**: The `<button id="theme-toggle">` element in the top bar used to switch themes.
- **Theme_Icon**: The `<span id="theme-icon">` element inside the Toggle_Button that displays the current-state icon.
- **Active_Theme**: The current color scheme in effect, one of the two values `"light"` or `"dark"`.
- **System_Preference**: The operating-system-level color-scheme preference reported by the `prefers-color-scheme` CSS media query.
- **Storage**: The browser's `localStorage` API, keyed on `ld_theme`.
- **Color_Token**: A CSS custom property defined on `:root` or `[data-theme="dark"]` that represents a design-system color value (e.g. `--clr-bg`, `--clr-text`).
- **Contrast_Ratio**: The relative luminance ratio between a foreground and background color as defined in WCAG 2.1 Success Criterion 1.4.3.
- **Transition_Duration**: The length of the animated cross-fade between themes, measured in milliseconds.
- **WCAG**: Web Content Accessibility Guidelines version 2.1.

---

## Requirements

### Requirement 1: Theme Initialisation on Page Load

**User Story:** As a returning user, I want the Dashboard to open in my previously chosen theme, so that I do not have to toggle it on every visit.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Theme_Controller SHALL read the value stored in Storage under the key `ld_theme`.
2. WHEN a valid stored value (`"light"` or `"dark"`) is found, THE Theme_Controller SHALL apply that value as the Active_Theme before any content is painted.
3. WHEN no valid stored value is found AND the System_Preference is `dark`, THE Theme_Controller SHALL apply `"dark"` as the Active_Theme before any content is painted.
4. WHEN no valid stored value is found AND the System_Preference is not `dark`, THE Theme_Controller SHALL apply `"light"` as the Active_Theme before any content is painted.
5. IF Storage throws a security exception during the read on page load, THEN THE Theme_Controller SHALL apply the Active_Theme derived from the System_Preference without writing to Storage.

---

### Requirement 2: Manual Theme Toggle

**User Story:** As a user, I want a clearly labelled button in the top bar to switch between light and dark themes instantly, so that I can change the appearance at will.

#### Acceptance Criteria

1. WHEN the user activates the Toggle_Button, THE Theme_Controller SHALL switch the Active_Theme from `"light"` to `"dark"` or from `"dark"` to `"light"`.
2. WHEN the Active_Theme changes, THE Theme_Controller SHALL set the `data-theme` attribute on the `<html>` element to the new Active_Theme value within one animation frame.
3. WHEN the Active_Theme is `"dark"`, THE Theme_Icon SHALL display the ☀️ emoji to indicate that clicking will switch to light mode.
4. WHEN the Active_Theme is `"light"`, THE Theme_Icon SHALL display the 🌙 emoji to indicate that clicking will switch to dark mode.
5. WHEN the Active_Theme changes via the Toggle_Button, THE Theme_Controller SHALL persist the new value to Storage under the key `ld_theme`.
6. IF Storage throws a security exception during the write, THEN THE Theme_Controller SHALL apply the new Active_Theme visually without interrupting the user interaction and without displaying an error message.

---

### Requirement 3: Accessible Toggle Button Labelling

**User Story:** As a screen-reader user, I want the theme toggle button to have a descriptive, up-to-date accessible label, so that I understand its current function without relying on the visual icon.

#### Acceptance Criteria

1. THE Toggle_Button SHALL carry an `aria-label` attribute at all times.
2. WHEN the Active_Theme is `"light"`, THE Toggle_Button SHALL have `aria-label` set to `"Switch to dark mode"`.
3. WHEN the Active_Theme is `"dark"`, THE Toggle_Button SHALL have `aria-label` set to `"Switch to light mode"`.
4. WHEN the Active_Theme changes, THE Theme_Controller SHALL update the Toggle_Button's `aria-label` to reflect the new target theme within one animation frame.
5. THE Toggle_Button SHALL have a `title` attribute whose value matches its `aria-label` at all times, providing a visible tooltip on pointer devices.
6. THE Toggle_Button SHALL be reachable and activatable via keyboard Tab navigation and the Enter or Space keys.

---

### Requirement 4: Smooth Visual Transition Animation

**User Story:** As a user, I want the switch between light and dark themes to feel smooth rather than jarring, so that the color change does not cause a sudden visual flash.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a CSS transition to `background-color`, `color`, `border-color`, and `fill` on all elements that change Color_Tokens when the Active_Theme changes.
2. THE Transition_Duration for theme changes SHALL be no less than 150 ms and no greater than 400 ms.
3. WHEN the Active_Theme changes, THE Dashboard SHALL complete the color transition within the Transition_Duration without layout shifts.
4. WHERE a user has enabled the `prefers-reduced-motion: reduce` media feature, THE Dashboard SHALL set the Transition_Duration to 0 ms so that no motion occurs during a theme change.

---

### Requirement 5: System Preference Live Synchronisation

**User Story:** As a user who changes the operating-system color scheme while the Dashboard is open, I want the Dashboard to update its theme automatically, so that I do not have to manually re-toggle it.

#### Acceptance Criteria

1. WHEN the Dashboard is open AND the user changes the System_Preference from light to dark, THE Theme_Controller SHALL apply the `"dark"` Active_Theme automatically, provided no explicit user preference is stored in Storage.
2. WHEN the Dashboard is open AND the user changes the System_Preference from dark to light, THE Theme_Controller SHALL apply the `"light"` Active_Theme automatically, provided no explicit user preference is stored in Storage.
3. WHILE an explicit user preference is stored in Storage, THE Theme_Controller SHALL NOT override the Active_Theme in response to System_Preference changes.
4. THE Theme_Controller SHALL register a `change` event listener on `window.matchMedia('(prefers-color-scheme: dark)')` to detect live System_Preference changes.
5. WHERE the browser does not support `window.matchMedia`, THE Theme_Controller SHALL skip live synchronisation without throwing an error.

---

### Requirement 6: WCAG 2.1 AA Color Contrast Compliance

**User Story:** As a user with low vision or color sensitivity, I want both the light and dark themes to meet minimum color-contrast standards, so that all text and interactive elements remain legible.

#### Acceptance Criteria

1. THE Dashboard SHALL ensure that the Contrast_Ratio between `--clr-text` and `--clr-bg` is at least 4.5:1 in both the `"light"` and `"dark"` Active_Themes.
2. THE Dashboard SHALL ensure that the Contrast_Ratio between `--clr-text-muted` and `--clr-bg` is at least 3:1 in both the `"light"` and `"dark"` Active_Themes.
3. THE Dashboard SHALL ensure that the Contrast_Ratio between `--clr-primary` used as a foreground color and `--clr-bg` is at least 3:1 in both Active_Themes.
4. THE Dashboard SHALL ensure that the Contrast_Ratio between white (`#ffffff`) and `--clr-primary` (used as a button background) is at least 4.5:1 in both Active_Themes.
5. THE Dashboard SHALL ensure that the Contrast_Ratio between `--clr-text` and `--clr-surface` is at least 4.5:1 in both Active_Themes, covering card and modal backgrounds.
6. THE Dashboard SHALL ensure that all interactive focus indicators (the `2px solid var(--clr-primary)` outline) have a Contrast_Ratio of at least 3:1 against the adjacent background in both Active_Themes.

---

### Requirement 7: Storage Unavailability Fallback

**User Story:** As a user in a privacy-restricted browser context where `localStorage` is blocked, I want the Dashboard to still function and apply a sensible theme, so that the application does not break or display an error.

#### Acceptance Criteria

1. IF Storage is unavailable when the Dashboard loads, THEN THE Theme_Controller SHALL apply the Active_Theme derived from the System_Preference without writing to Storage.
2. IF Storage is unavailable when the user activates the Toggle_Button, THEN THE Theme_Controller SHALL apply the new Active_Theme visually for the current session only, without persisting it.
3. WHILE Storage is unavailable, THE Theme_Controller SHALL operate normally for all other toggle and synchronisation functionality.
4. IF Storage is unavailable, THEN THE Dashboard SHALL NOT display any error message, warning banner, or console error visible to the user.
5. WHEN Storage becomes available again (e.g. after a browser permission change and page reload), THE Theme_Controller SHALL resume normal read and write operations on next page load.
