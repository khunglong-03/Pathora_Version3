-- Migration script for step 10.J
-- Deactivate all duplicate active policies per TourScope, keeping only the most recently created one.

WITH RankedPolicies AS (
    SELECT 
        "Id",
        "TourScope",
        "Status",
        "IsDeleted",
        "CreatedOnUtc",
        ROW_NUMBER() OVER (PARTITION BY "TourScope" ORDER BY "CreatedOnUtc" DESC) as rn
    FROM "CancellationPolicies"
    WHERE "Status" = 'Active' AND "IsDeleted" = false
)
UPDATE "CancellationPolicies"
SET 
    "Status" = 'Inactive',
    "LastModifiedBy" = 'migration_2026',
    "LastModifiedOnUtc" = CURRENT_TIMESTAMP
WHERE "Id" IN (
    SELECT "Id"
    FROM RankedPolicies
    WHERE rn > 1
);
