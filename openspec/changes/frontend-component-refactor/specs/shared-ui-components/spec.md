# Shared UI Components

## ADDED Requirements

### Requirement: StatusBadge is a reusable generic badge component

The system SHALL provide a shared `StatusBadge` component in `src/components/ui/StatusBadge.tsx` that renders a pill-shaped badge with customizable background color, text color, dot indicator, and label.

#### Scenario: Render a tour-status badge
- **WHEN** a component passes `status="Active"` and domain `"tour"` to `StatusBadge`
- **THEN** it renders a green pill badge with a green dot and "Active" label

#### Scenario: Render a payment-status badge
- **WHEN** a component passes `status="Paid"` and domain `"payment"` to `StatusBadge`
- **THEN** it renders a green pill badge with "Paid" label

#### Scenario: Render an unknown status
- **WHEN** a component passes an unrecognized status value
- **THEN** it renders a neutral stone-colored badge with the original status text

### Requirement: StatusBadge provides domain-specific helper functions

The system SHALL provide domain-specific helper functions that return `{ bg, text, dot, label }` tokens for each status value, enabling components to pass raw status strings.

#### Scenario: Tour status helper
- **WHEN** `getTourStatusProps("pending")` is called
- **THEN** it returns `{ bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "pending" }`

#### Scenario: Payment status helper
- **WHEN** `getPaymentStatusProps("failed")` is called
- **THEN** it returns `{ bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "failed" }`

### Requirement: StatCard is a reusable statistics card component

The system SHALL provide a shared `StatCard` component in `src/components/ui/StatCard.tsx` that displays a metric with label, value, icon, and accent color.

#### Scenario: Render a stat card with accent color
- **WHEN** a component renders `StatCard` with `labelKey="Total Tours"`, `value="42"`, `icon="globe"`, `accent="#22C55E"`
- **THEN** it displays a card with the label, large value, icon in a colored container, and hover shadow

### Requirement: StatCard supports eyebrow and subtext

The system SHALL support optional `eyebrow` (small colored tag above label) and `subtext` (description below value) props.

#### Scenario: StatCard with eyebrow
- **WHEN** a component renders `StatCard` with `eyebrow="Live"` prop
- **THEN** it displays a small pill above the label with the eyebrow text and accent color

#### Scenario: StatCard with subtext
- **WHEN** a component renders `StatCard` with `subtext="Updated 2 min ago"` prop
- **THEN** it displays a description text below the value

### Requirement: All existing consumer components use shared components

The system SHALL update all components that define local `StatusBadge` or `StatCard` to import from the shared location instead.

#### Scenario: Tour list page uses shared StatusBadge
- **WHEN** `TourListPage.tsx` is rendered
- **THEN** its `StatusBadge` comes from `@/components/ui/StatusBadge`
- **AND** visual appearance is unchanged from the original local definition

#### Scenario: Tour instance list page uses shared StatCard
- **WHEN** `TourInstanceListPage.tsx` is rendered
- **THEN** its `StatCard` comes from `@/components/ui/StatCard`
- **AND** visual appearance is unchanged from the original local definition
