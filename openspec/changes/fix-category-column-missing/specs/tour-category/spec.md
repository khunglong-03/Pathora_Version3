## ADDED Requirements

### Requirement: Tour Category Property
Tour entity SHALL have a `Category` property that stores the category/danh mục of a tour.

#### Scenario: Category stored in database
- **WHEN** a tour is created with a category value
- **THEN** the category SHALL be persisted in the `Tours.Category` column
- **AND** the value SHALL be retrievable via API

#### Scenario: Category is nullable
- **WHEN** a tour is created without a category
- **THEN** the `Category` column SHALL store NULL
- **AND** the API SHALL return null for that field

#### Scenario: Category is optional string
- **WHEN** storing a category value
- **THEN** the value SHALL be a string with maximum length of 200 characters
