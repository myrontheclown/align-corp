# Security Specification - Sync Performance

## Data Invariants
1. **Goal Ownership**: A goal must belong to a valid user. Only the owner can create a goal.
2. **Review Integrity**: Quarterly reviews must have a valid year and quarter (1-4).
3. **Role-Based Access**: 
    - Employees can read/write their own goals and reviews.
    - Managers can read their direct reports' goals and reviews.
    - Managers can update `managerFeedback` and `rating` in reviews of their direct reports.
    - Admins have full read access but restricted write (mostly for user role management).
4. **User Profile Persistence**: Users cannot change their own `role` or `managerId` once set by an admin.

## The "Dirty Dozen" Payloads (Breaking Identity, Integrity, and State)

1. **Identity Spoofing**: Attempt to create a goal for another user.
   ```json
   { "userId": "victim_uid", "title": "Evil Goal" }
   ```
2. **Privilege Escalation**: User tries to set their own role to 'admin'.
   ```json
   { "role": "admin" }
   ```
3. **Shadow Field Injection**: Adding an `isVerified: true` field to a goal.
   ```json
   { "title": "Goal", "isVerified": true }
   ```
4. **Relational Sync Bypass**: Creating a goal with a `userId` that doesn't exist in the `users` collection.
5. **Rating Overflow**: Setting a review rating to 999.
6. **Immutable Field Mutation**: Changing the `userId` of an existing goal.
7. **Negative Progress**: Setting goal progress to -50.
8. **Unauthorized Feedback**: Employee trying to write their own `managerFeedback`.
9. **Terminal State Mutation**: Trying to update a 'finalized' review.
10. **Orphaned Goal**: Creating a goal without a `userId`.
11. **Malicious ID**: Using a 1MB string as a `goalId`.
12. **Cross-Department Access**: Manager trying to read a user's goals who is not their direct report.

## Test Runner Plan
- Test create/read/update/delete for each collection.
- Verify role-based gating.
- Verify schema validation (isValidGoal, isValidReview, isValidUser).
