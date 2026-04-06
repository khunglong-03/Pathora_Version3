# tour-instance-itinerary-management

## ADDED Requirements

### Requirement: Admin can view full itinerary on tour instance detail

The system SHALL allow admins to view the complete itinerary of a tour instance, including all days and all activities within each day, with their current values (title, description, times, notes, optional flags).

#### Scenario: View itinerary on instance detail page
- **WHEN** admin navigates to a tour instance detail page
- **THEN** the system displays a list of days sorted by `instanceDayNumber`
- **AND** each day shows its `title`, `description`, `actualDate`, `startTime`, `endTime`, and `note`
- **AND** each day expands to show its activities in `order` sequence
- **AND** each activity shows `title`, `description`, `startTime`, `endTime`, `isOptional`, and `note`

#### Scenario: View itinerary preview on instance creation page
- **WHEN** admin has selected a tour and classification on the create instance page
- **THEN** the system displays a collapsed "Itinerary Preview" section below the form fields
- **AND** expanding it shows all days and activities that will be cloned from the selected classification
- **AND** this preview is read-only (no editing in preview mode)
- **AND** no additional API call is needed (data comes from `selectedClassification.plans` already in form state)

### Requirement: Admin can edit instance day header

The system SHALL allow admins to update the metadata of an instance day via a REST endpoint.

#### Scenario: Update day metadata successfully
- **WHEN** admin calls `PUT /api/tour-instance/{instanceId}/days/{dayId}` with valid payload
- **AND** the payload contains `title`, `description`, `actualDate`, `startTime`, `endTime`, `note`
- **THEN** the system updates the corresponding `TourInstanceDayEntity`
- **AND** returns `200 OK` with the updated `TourInstanceDayDto`

#### Scenario: Update day with invalid instance ID
- **WHEN** admin calls `PUT /api/tour-instance/{invalidId}/days/{dayId}` with valid payload
- **THEN** the system returns `404 Not Found`

#### Scenario: Update day with invalid day ID
- **WHEN** admin calls `PUT /api/tour-instance/{instanceId}/days/{invalidDayId}` with valid payload
- **THEN** the system returns `404 Not Found`

#### Scenario: Update day with missing required fields
- **WHEN** admin calls `PUT /api/tour-instance/{instanceId}/days/{dayId}` with payload missing `title`
- **THEN** the system returns `400 Bad Request` with validation errors

### Requirement: Admin can update activity properties on an instance day

The system SHALL allow admins to patch individual activity properties (note, times, optional flag) for a specific instance day.

#### Scenario: Update activity properties successfully
- **WHEN** admin calls `PATCH /api/tour-instance/{instanceId}/days/{dayId}/activities/{activityId}` with payload
- **AND** the payload contains any subset of `note`, `startTime`, `endTime`, `isOptional`
- **THEN** the system updates only the provided fields on the referenced `TourDayActivityEntity`
- **AND** returns `200 OK` with the updated `TourDayActivityDto`

#### Scenario: Update activity on non-existent instance
- **WHEN** admin calls `PATCH /api/tour-instance/{invalidId}/days/{dayId}/activities/{activityId}`
- **THEN** the system returns `404 Not Found`

#### Scenario: Update activity on non-existent day
- **WHEN** admin calls `PATCH /api/tour-instance/{instanceId}/days/{invalidDayId}/activities/{activityId}`
- **THEN** the system returns `404 Not Found`

#### Scenario: Update non-existent activity
- **WHEN** admin calls `PATCH /api/tour-instance/{instanceId}/days/{dayId}/activities/{invalidActivityId}`
- **THEN** the system returns `404 Not Found`

#### Scenario: Activity update does not affect template
- **WHEN** admin updates an activity's `note` on an instance day
- **THEN** the corresponding `TourDayActivityEntity` in the template classification is NOT modified
- **AND** other instances using the same classification see their own note values

### Requirement: Backend eager-loads activities for admin queries

The repository query used by the admin detail endpoint SHALL eagerly load the full activities hierarchy so that the detail page can display activities without additional queries.

#### Scenario: Admin detail endpoint returns activities
- **WHEN** admin calls `GET /api/tour-instance/{id}` (admin detail)
- **THEN** the response includes `days[].tourDay.activities[]` with all activity data populated
- **AND** no additional API calls are needed on the frontend to load activities

### Requirement: Admin can set images during instance creation

The system SHALL allow admins to provide image URLs at the time of instance creation.

#### Scenario: Set images during creation with valid URLs
- **WHEN** admin submits the create instance form with `imageUrls` field populated
- **AND** the URLs are valid image URLs
- **THEN** the system creates the instance with those images associated
- **AND** the created instance returns the images in `TourInstanceDto.images`

#### Scenario: Set images during creation with empty URLs
- **WHEN** admin submits the create instance form with empty `imageUrls`
- **THEN** the system creates the instance with an empty images list
- **AND** behaves the same as if `imageUrls` was not provided

#### Scenario: Create instance without images
- **WHEN** admin submits the create instance form without `imageUrls` field
- **THEN** the system creates the instance with an empty images list
- **AND** this is equivalent to setting `imageUrls` to an empty array

### Requirement: Frontend reuses POST response instead of redundant GET

The `createInstance()` service method SHALL return the full `TourInstanceDto` from the POST response, eliminating the need for a redundant GET request after creation.

#### Scenario: Create instance returns full DTO
- **WHEN** admin successfully creates a tour instance via `POST /api/tour-instance`
- **THEN** the `createInstance()` method returns the complete `TourInstanceDto` from the response
- **AND** the response includes all fields: id, code, title, days, managers, includedServices, images, thumbnail, and all other instance data

#### Scenario: Detail page uses POST response data
- **WHEN** admin creates a tour instance and is redirected to the detail page
- **AND** the `TourInstanceDto` was stored from the POST response
- **THEN** the detail page displays all instance data immediately without a loading spinner
- **AND** no additional GET request is made when POST response data is available

#### Scenario: Detail page falls back to GET when no POST data
- **WHEN** admin navigates directly to a tour instance detail page (not via create redirect)
- **THEN** the detail page makes a GET request to fetch instance data
- **AND** behaves exactly as before for direct navigation

#### Scenario: POST response data unavailable (sessionStorage cleared)
- **WHEN** admin navigates to detail page but the stored POST response is unavailable
- **THEN** the detail page makes a GET request as a fallback
- **AND** no error is shown to the user
