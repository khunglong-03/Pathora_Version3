# Tour Discovery Filters

## ADDED Requirements

### Requirement: Classification filter shall narrow tour results

When a user selects one or more classification filters (Standard, Premium, VIP/Luxury, Budget, Private, Group) on the Tour Discovery page, the system SHALL send those classifications as a comma-separated `classification` query parameter to `GET /api/public/tours/search` and display only tours matching the selected classifications.

#### Scenario: Single classification selected

- **WHEN** user selects "Premium" in the classification filter
- **THEN** the system calls `/api/public/tours/search?classification=Premium&q=<destination>&page=1&pageSize=6&lang=<language>`
- **AND** results display only tours with classification "Premium"

#### Scenario: Multiple classifications selected

- **WHEN** user selects "Premium" and "VIP/Luxury" in the classification filter
- **THEN** the system calls `/api/public/tours/search?classification=Premium,VIP/Luxury&q=<destination>&page=1&pageSize=6&lang=<language>`
- **AND** results display tours with classification "Premium" OR "VIP/Luxury"

#### Scenario: Classification filter cleared

- **WHEN** user removes all classification filters (clicks "x" on chips or "Clear all")
- **THEN** the system calls `/api/public/tours/search` without the `classification` parameter
- **AND** results display all tours matching other active filters

### Requirement: Category filter shall narrow tour results

When a user selects one or more category filters (Adventure, Cultural, Relaxation, Eco, Food, Religious, Honeymoon) on the Tour Discovery page, the system SHALL send those categories as a comma-separated `category` query parameter to `GET /api/public/tours/search` and display only tours matching the selected categories.

#### Scenario: Single category selected

- **WHEN** user selects "Adventure" in the category filter
- **THEN** the system calls `/api/public/tours/search?category=Adventure&q=<destination>&page=1&pageSize=6&lang=<language>`
- **AND** results display only tours with category "Adventure"

#### Scenario: Multiple categories selected

- **WHEN** user selects "Adventure" and "Cultural" in the category filter
- **THEN** the system calls `/api/public/tours/search?category=Adventure,Cultural&q=<destination>&page=1&pageSize=6&lang=<language>`
- **AND** results display tours with category "Adventure" OR "Cultural"

### Requirement: Classification and category filters shall combine

When both classification and category filters are active, the system SHALL send both parameters to the API and return tours matching BOTH conditions (AND between classification and category, OR within each filter group).

#### Scenario: Both filter types active

- **WHEN** user selects classification "Premium" and category "Adventure"
- **THEN** the system calls `/api/public/tours/search?classification=Premium&category=Adventure&q=<destination>&page=1&pageSize=6&lang=<language>`
- **AND** results display tours with classification "Premium" AND category "Adventure"

### Requirement: Active filters shall persist in URL

When a user applies classification or category filters, the system SHALL update the URL with `classification=<values>` and `category=<values>` query parameters, enabling deep-linking and browser navigation support.

#### Scenario: URL reflects filter state

- **WHEN** user selects classification "Premium" and category "Cultural"
- **THEN** the URL updates to `/tours?destination=<dest>&classification=Premium&category=Cultural&page=1`
- **AND** navigating to this URL directly pre-selects "Premium" and "Cultural" filters and loads matching results

### Requirement: Filter change shall reset pagination

When a user changes any filter selection, the system SHALL reset the current page to 1 and reload results from the first page.

#### Scenario: Filter change resets page

- **WHEN** user is on page 3 of results
- **AND** changes the classification filter
- **THEN** the system resets to page 1 and displays results for the new filter
