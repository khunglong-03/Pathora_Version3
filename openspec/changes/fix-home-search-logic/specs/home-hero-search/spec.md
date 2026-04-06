# Home Hero Search

## ADDED Requirements

### Requirement: Hero search bar shall accept text input

The hero search bar on the public home page (`/home`) SHALL accept text input from the user in a text field.

#### Scenario: User types in hero search bar

- **WHEN** user types "Ha Long Bay" in the hero search input
- **THEN** the input displays "Ha Long Bay"
- **AND** the value is stored in component state

### Requirement: Hero search submit shall navigate to tour discovery

When a user enters text and submits the hero search (via Enter key or clicking "Explore"), the system SHALL navigate to `/tours?destination=<searched_text>`.

#### Scenario: Submit via Enter key

- **WHEN** user types "Ha Long Bay" and presses Enter
- **THEN** the system navigates to `/tours?destination=Ha%20Long%20Bay`
- **AND** the Tour Discovery page loads with "Ha Long Bay" as the search text

#### Scenario: Submit via Explore button

- **WHEN** user types "Sapa" and clicks "Explore" button
- **THEN** the system navigates to `/tours?destination=Sapa`
- **AND** the Tour Discovery page loads with "Sapa" as the search text

### Requirement: Empty hero search shall navigate with empty destination

When a user submits an empty hero search, the system SHALL navigate to `/tours` without a destination parameter.

#### Scenario: Empty submit

- **WHEN** user clicks "Explore" without entering text
- **THEN** the system navigates to `/tours`
- **AND** the Tour Discovery page loads with all tours (no destination filter)
