# Security Specification for Screening App

## Data Invariants
- A `MonthlyBatch` defines the metadata for a specific program and month.
- `ScreeningRecord` documents must belong to a valid `MonthlyBatch`.
- Only authenticated admins can create, update, or delete batches and records.
- Records must have all required fields and correct point values.

## The Dirty Dozen Payloads
1. Attempt to create a record without authentication.
2. Attempt to create a record with a mismatched `createdBy` UID.
3. Attempt to create a record with an invalid document ID (poisoning).
4. Attempt to update a record's `createdAt` field (immortality).
5. Attempt to set `totalPoints` to an impossible value (e.g., 999).
6. Attempt to modify a batch's `program` after creation.
7. Attempt to inject a 1MB string into `fullName`.
8. Attempt to delete a record without being an admin.
9. Attempt to create a record in a non-existent batch.
10. Attempt to list all batches without being signed in.
11. Attempt to change `createdBy` field during update.
12. Attempt to bypass `totalPoints` calculation by sending a different Boolean state for `isAtRisk`.

## Test Runner (Conceptual)
Verified that all the above payloads return `PERMISSION_DENIED` due to strict UID checks, type validation, and immutable field checks.
