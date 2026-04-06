## MODIFIED Requirements

### Requirement: Public Tour Search
The system SHALL allow users to search and filter public tours.

#### Scenario: Search tours by text
- **WHEN** user searches with text query
- **THEN** system returns tours matching the query by name or code

#### Scenario: Filter tours by classification
- **WHEN** user selects classification filters
- **THEN** system returns tours matching selected classifications

#### Scenario: Filter tours by destination
- **WHEN** user selects destination filters
- **THEN** system returns tours matching selected destinations

#### Scenario: Filter tours by date
- **WHEN** user selects date filter
- **THEN** system returns tours created on or before the selected date

#### Scenario: Filter tours by number of people
- **WHEN** user specifies number of people
- **THEN** system returns tours that can accommodate the specified number

#### Scenario: Filter tours by price range
- **WHEN** user specifies min/max price
- **THEN** system returns tours within the price range

#### Scenario: Filter tours by duration
- **WHEN** user specifies min/max days
- **THEN** system returns tours within the duration range

#### Scenario: Paginated results
- **WHEN** user requests tour search
- **THEN** system returns paginated results with total count

## REMOVED Requirements

### Requirement: Filter tours by category
**Reason**: Property `TourEntity.Category` does not exist in database schema and is not used. Category filter UI and backend logic removed entirely.
**Migration**: N/A - feature was non-functional
