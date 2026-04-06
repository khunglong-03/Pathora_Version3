## ADDED Requirements

### Requirement: Empty state message on Package Tour dropdown
The system SHALL display an inline empty state message below the Package Tour select element when no active tours are available after a successful data load.

#### Scenario: No active tours available
- **WHEN** the Package Tour dropdown loads and `tours` array is empty, `loading` is false, and `loadError` is null
- **THEN** the system SHALL display an italic text message below the select element informing the user that no active tours are available

#### Scenario: Tours are available
- **WHEN** the Package Tour dropdown loads and `tours` array contains one or more tour items
- **THEN** the system SHALL NOT display the empty state message

#### Scenario: Loading in progress
- **WHEN** the Package Tour dropdown is loading (`loading` is true)
- **THEN** the system SHALL display skeleton placeholders and SHALL NOT display the empty state message

#### Scenario: Load error occurred
- **WHEN** the data load fails with an error (`loadError` is set)
- **THEN** the system SHALL display the error banner with a Retry button and SHALL NOT display the empty state message

#### Scenario: Empty state message is i18n-compatible
- **WHEN** the empty state message is rendered
- **THEN** the system SHALL use the translation key `tourInstance.noActiveTours` so the message is displayed in the user's selected language
