# Requirements Document

## Introduction

The Life Dashboard to-do list currently allows users to add tasks with identical text, including tasks that differ only by letter casing. This leads to a cluttered list and user confusion. This feature adds duplicate detection to the task-addition flow, using case-insensitive comparison against all existing tasks (both pending and completed). When a duplicate is detected, the system provides clear, accessible inline feedback and keeps the input focused so the user can correct or dismiss the attempt without data loss.

---

## Glossary

- **Todo_List**: The in-memory array of task objects (`Array<{id:string, text:string, done:boolean}>`) loaded from and persisted to `localStorage` under the key `ld_todos`.
- **Duplicate_Detector**: The logic component responsible for checking whether a candidate task text already exists in the Todo_List using a case-insensitive comparison.
- **Candidate_Text**: The trimmed string value entered by the user in the `#todo-input` field before submission.
- **Normalized_Text**: The result of converting Candidate_Text to lowercase, used exclusively for comparison purposes; the original casing of stored task text is never mutated.
- **Inline_Error**: A text message rendered directly beneath the `#todo-form` element that describes why a submission was rejected.
- **Error_State**: The visual condition of `#todo-input` when its border is set to `var(--clr-danger)` and the Inline_Error is visible.
- **Active_Task**: A task object in the Todo_List whose `done` property is `false`.
- **Completed_Task**: A task object in the Todo_List whose `done` property is `true`.

---

## Requirements

### Requirement 1: Case-Insensitive Duplicate Detection

**User Story:** As a user, I want the to-do list to detect duplicate tasks regardless of how I capitalize them, so that I do not accidentally create redundant entries.

#### Acceptance Criteria

1. WHEN the user submits `#todo-form`, THE Duplicate_Detector SHALL compare the Candidate_Text against every task in the Todo_List using Normalized_Text (lowercase) comparison.
2. WHEN the Duplicate_Detector finds a match, THE Todo_List SHALL not add the Candidate_Text as a new task.
3. THE Duplicate_Detector SHALL treat Active_Tasks and Completed_Tasks equally during comparison — a match against either kind counts as a duplicate.
4. WHEN the Duplicate_Detector finds no match, THE Todo_List SHALL add the Candidate_Text as a new task with a unique `id` and `done: false`, preserving the original casing entered by the user.
5. THE Duplicate_Detector SHALL perform comparison after trimming leading and trailing whitespace from Candidate_Text, consistent with the existing `addTodo` behaviour.

---

### Requirement 2: Inline Duplicate Error Feedback

**User Story:** As a user, I want to see a clear message when I try to add a duplicate task, so that I understand why my submission was not accepted.

#### Acceptance Criteria

1. WHEN the Duplicate_Detector finds a duplicate, THE Todo_List UI SHALL display an Inline_Error beneath `#todo-form` with a message that names the duplicate task text.
2. WHEN the Inline_Error is visible, THE `#todo-input` field SHALL enter Error_State, applying a border color of `var(--clr-danger)`.
3. WHEN the Inline_Error is visible, THE `#todo-input` field SHALL retain the Candidate_Text so the user can edit it without retyping.
4. WHEN the Inline_Error is visible, THE `#todo-input` field SHALL receive focus automatically.
5. THE Inline_Error element SHALL include `role="alert"` and `aria-live="polite"` so that screen readers announce the message without interrupting the user's current interaction.
6. WHEN the Duplicate_Detector finds no duplicate after a subsequent submission, THE Todo_List UI SHALL remove the Inline_Error and clear the Error_State from `#todo-input`.

---

### Requirement 3: Automatic Error Dismissal

**User Story:** As a user, I want the error feedback to disappear once I start correcting my input, so that the interface does not remain in a blocked or alarming state longer than necessary.

#### Acceptance Criteria

1. WHEN the user modifies the value of `#todo-input` while the Inline_Error is visible, THE Todo_List UI SHALL remove the Inline_Error and clear the Error_State from `#todo-input`.
2. WHEN the user clears `#todo-input` entirely while the Inline_Error is visible, THE Todo_List UI SHALL remove the Inline_Error and clear the Error_State from `#todo-input`.
3. WHEN the user presses the Escape key while `#todo-input` is focused and the Inline_Error is visible, THE Todo_List UI SHALL remove the Inline_Error, clear the Error_State, and clear the `#todo-input` value.

---

### Requirement 4: Duplicate Check During Inline Edit

**User Story:** As a user, I want the app to prevent me from renaming a task to the text of another existing task, so that I cannot create duplicates through the edit flow either.

#### Acceptance Criteria

1. WHEN the user saves an inline edit via the Save button or the Enter key, THE Duplicate_Detector SHALL compare the edited text against all tasks in the Todo_List except the task currently being edited.
2. WHEN the Duplicate_Detector finds a duplicate during an inline edit, THE Todo_List UI SHALL not commit the edit and SHALL display an Inline_Error adjacent to the edit input field.
3. WHEN the Duplicate_Detector finds a duplicate during an inline edit, THE edit input field SHALL enter Error_State and SHALL retain focus.
4. WHEN the user cancels an inline edit while a duplicate error is shown, THE Todo_List UI SHALL discard the edit and restore the original task text without committing any change.

---

### Requirement 5: Persistence Integrity

**User Story:** As a user, I want the duplicate prevention to remain effective across page reloads, so that tasks saved in a previous session are still protected against duplication.

#### Acceptance Criteria

1. WHEN the page loads, THE Todo_List SHALL hydrate from `localStorage` key `ld_todos` before any duplicate check is performed, ensuring all previously saved tasks — both Active_Tasks and Completed_Tasks — are available to the Duplicate_Detector.
2. THE Duplicate_Detector SHALL never write to `localStorage`; writes SHALL occur only when a task is successfully added, edited, toggled, or deleted, consistent with the existing `saveTodos` behaviour.
