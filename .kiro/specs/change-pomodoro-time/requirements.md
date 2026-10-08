# Requirements Document

## Introduction

The Life Dashboard already includes a basic Pomodoro focus timer with a number input for configuring session duration. However, the chosen duration is not persisted across page reloads, the input-disable behavior during an active session is not formally specified, and there is no guidance for what happens when a user changes the duration while the timer is paused mid-session.

This feature enhances the Change Pomodoro Time capability with four improvements:

1. **Persistence** — the chosen duration is saved to `localStorage` and restored on page load.
2. **Preset buttons** — optional quick-select buttons (25 min, 45 min, 60 min) complement the existing number input.
3. **Validation and clamping** — any value outside the 1–120 minute range is corrected before it is applied.
4. **Paused-session resolution** — when the user changes duration while the timer is paused mid-session, a clear modal dialog asks whether to apply the new duration immediately or defer it until the next reset.

---

## Glossary

- **Timer** — the Pomodoro focus timer component inside the Focus Timer card (`#timer-*` elements).
- **Duration_Input** — the `<input type="number" id="pomodoro-duration">` element in the timer card header.
- **Preset_Button** — an optional quick-select button that sets the Duration_Input to a predefined value (25, 45, or 60 minutes).
- **Duration_Value** — the integer number of minutes, clamped to [1, 120], that defines the length of one Pomodoro session.
- **Session** — a single countdown from Duration_Value minutes to zero.
- **Running state** — the timer state in which the countdown interval is active and seconds are decrementing.
- **Paused state** — the timer state in which a session has started but has been paused before reaching zero; `timerRemaining` is less than `timerTotalSecs`.
- **Idle state** — the timer state in which no session is in progress and `timerRemaining` equals `timerTotalSecs` (fresh load or after a reset).
- **Apply_Modal** — a dialog that appears when the user changes Duration_Value while in Paused state, offering two resolution options.
- **Storage** — the browser's `localStorage` API.
- **KEYS.POMODORO_DURATION** — the `localStorage` key used to persist Duration_Value (value: `"ld_pomodoro_duration"`).

---

## Requirements

### Requirement 1: Persist Duration Across Page Reloads

**User Story:** As a user, I want my chosen Pomodoro duration to be remembered between visits, so that I do not have to re-enter my preferred duration every time I open the dashboard.

#### Acceptance Criteria

1. WHEN the user changes the Duration_Input value and the Timer is in Idle state or Paused state, THE Timer SHALL save the new Duration_Value to Storage under KEYS.POMODORO_DURATION.
2. WHEN the user selects a Preset_Button, THE Timer SHALL save the corresponding Duration_Value to Storage under KEYS.POMODORO_DURATION.
3. WHEN the page loads, THE Timer SHALL read KEYS.POMODORO_DURATION from Storage and set Duration_Input to the stored Duration_Value.
4. IF KEYS.POMODORO_DURATION is absent from Storage on page load, THEN THE Timer SHALL set Duration_Input to 25 (the default value).
5. IF the value stored under KEYS.POMODORO_DURATION is outside the range [1, 120] at load time, THEN THE Timer SHALL clamp the value to that range before applying it to Duration_Input.
6. WHEN Duration_Value is saved to Storage, THE Timer SHALL verify the save by reading back the stored value and logging a console warning if the read-back value does not match.

---

### Requirement 2: Preset Quick-Select Buttons

**User Story:** As a user, I want preset duration buttons (25 min, 45 min, 60 min), so that I can switch to a common session length with a single click without typing.

#### Acceptance Criteria

1. THE Timer SHALL render three Preset_Buttons labeled "25 min", "45 min", and "60 min" adjacent to Duration_Input.
2. WHEN the user clicks a Preset_Button, THE Timer SHALL set Duration_Input to the button's corresponding Duration_Value.
3. WHEN the user clicks a Preset_Button and the Timer is in Idle state, THE Timer SHALL reset the Session to the new Duration_Value without opening the Apply_Modal.
4. WHEN the user clicks a Preset_Button and the Timer is in Paused state, THE Timer SHALL open the Apply_Modal with the new Duration_Value as the pending value.
5. WHEN the user clicks a Preset_Button and the Timer is in Running state, THE Preset_Button SHALL be disabled and produce no effect.
6. WHILE the Timer is in Running state, THE Timer SHALL disable all Preset_Buttons.
7. WHILE the Timer is in Idle state or Paused state, THE Timer SHALL enable all Preset_Buttons.
8. WHEN Duration_Input is set programmatically by a Preset_Button, THE Timer SHALL visually mark the matching Preset_Button as active (e.g., apply an `.is-active` CSS class) and remove the active mark from all other Preset_Buttons.
9. WHEN Duration_Input is edited manually and its value matches a Preset_Button value, THE Timer SHALL apply the `.is-active` class to that Preset_Button.
10. WHEN Duration_Input is edited manually and its value does not match any Preset_Button value, THE Timer SHALL remove `.is-active` from all Preset_Buttons.

---

### Requirement 3: Input Validation and Clamping

**User Story:** As a user, I want the timer to correct invalid duration values automatically, so that I never accidentally start a session with a nonsensical or out-of-range duration.

#### Acceptance Criteria

1. THE Timer SHALL accept only integer values for Duration_Value.
2. IF the user enters a value less than 1 into Duration_Input, THEN THE Timer SHALL clamp Duration_Input to 1.
3. IF the user enters a value greater than 120 into Duration_Input, THEN THE Timer SHALL clamp Duration_Input to 120.
4. IF the user clears Duration_Input (empty string) and leaves the field, THEN THE Timer SHALL restore Duration_Input to the last valid Duration_Value.
5. IF the user enters a non-numeric value into Duration_Input, THEN THE Timer SHALL restore Duration_Input to the last valid Duration_Value.
6. WHEN Duration_Input loses focus, THE Timer SHALL apply clamping and normalisation to the current field value before persisting it to Storage.
7. WHEN a valid Duration_Value is entered and the Timer is in Idle state, THE Timer SHALL update the timer display to reflect the new Duration_Value immediately without requiring a manual reset.

---

### Requirement 4: Disable Duration Controls During Running State

**User Story:** As a user, I want the duration input and preset buttons to be locked while the timer is counting down, so that I cannot accidentally alter a session that is already in progress.

#### Acceptance Criteria

1. WHILE the Timer is in Running state, THE Timer SHALL set Duration_Input's `disabled` attribute to `true`.
2. WHILE the Timer is in Running state, THE Timer SHALL set each Preset_Button's `disabled` attribute to `true`.
3. WHEN the Timer transitions from Running state to Paused state, THE Timer SHALL remove the `disabled` attribute from Duration_Input.
4. WHEN the Timer transitions from Running state to Paused state, THE Timer SHALL remove the `disabled` attribute from all Preset_Buttons.
5. WHEN the Timer transitions from Running state to Idle state (session complete or reset), THE Timer SHALL remove the `disabled` attribute from Duration_Input.
6. WHEN the Timer transitions from Running state to Idle state (session complete or reset), THE Timer SHALL remove the `disabled` attribute from all Preset_Buttons.
7. WHEN Duration_Input or a Preset_Button is disabled, THE Timer SHALL render those controls with a visually distinct style (reduced opacity via `.btn:disabled` and `.input:disabled` existing CSS rules) to communicate their unavailability.

---

### Requirement 5: Change Duration While Paused — Apply_Modal Resolution

**User Story:** As a user, I want a clear choice when I change the duration while a session is paused, so that I can decide whether to restart my current session with the new length or resume from where I left off and apply the change next time.

#### Acceptance Criteria

1. WHEN the user changes Duration_Input while the Timer is in Paused state, THE Timer SHALL open the Apply_Modal.
2. WHEN the user selects a Preset_Button while the Timer is in Paused state, THE Timer SHALL open the Apply_Modal.
3. THE Apply_Modal SHALL display the current remaining time and the pending new Duration_Value so the user understands the impact of each choice.
4. THE Apply_Modal SHALL provide two actions: "Apply Now" and "Apply on Next Reset".
5. WHEN the user confirms "Apply Now" in the Apply_Modal, THE Timer SHALL reset the Session to the new Duration_Value, update Duration_Input to the new Duration_Value, save the new Duration_Value to Storage, and close the Apply_Modal.
6. WHEN the user confirms "Apply on Next Reset" in the Apply_Modal, THE Timer SHALL retain the current remaining time, update Duration_Input to the new Duration_Value, save the new Duration_Value to Storage, close the Apply_Modal, and apply the new Duration_Value only on the next explicit reset or when a new session starts from Idle state.
7. WHEN the user dismisses the Apply_Modal (via a Cancel/close action or the Escape key), THE Timer SHALL revert Duration_Input to the previous Duration_Value, remove the `.is-active` class adjustment from any Preset_Button triggered by the pending change, and close the Apply_Modal without modifying the Session.
8. WHILE the Apply_Modal is open, THE Timer SHALL remain in Paused state and the countdown SHALL NOT resume.
9. IF the Timer is in Idle state when Duration_Input changes, THEN THE Timer SHALL NOT open the Apply_Modal and SHALL apply the new Duration_Value immediately.
