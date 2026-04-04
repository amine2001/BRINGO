# QA Checklist

Use this checklist to manually verify the Last Mile Control Tower flow after any backend, notification, or dashboard change.

## Preflight

- Confirm the app boots without console errors.
- Confirm Supabase, Redash, and Telegram env vars are present in the runtime environment.
- Confirm cron polling is enabled and protected.
- Confirm there is no time-slot or `creneau` logic in the current flow.

## Full Flow

1. Log in as an admin user.
2. Open the admin dashboard and verify stores load correctly.
3. Add or edit a store and save it.
4. Assign delivery types per store and confirm EXPRESS, MARKET, and HYPER can be enabled or disabled independently.
5. Create or update Telegram group mappings for each delivery type.
6. Update notification settings:
   - repeat count
   - interval in seconds
   - stop on accepted
   - stop on delivered
7. Update delay settings:
   - threshold minutes
   - admin Telegram chat ID
8. Save Redash API configuration and verify the fetch endpoint uses the configured values.
9. Run a Redash poll and confirm new orders are stored in `orders_cache`.
10. Confirm the first unseen order produces exactly one initial notification.
11. Confirm repeated polls do not duplicate the same notification without a state change.
12. Confirm reminder notifications repeat only up to the configured limit.
13. Confirm reminders stop after the order reaches accepted or delivered when the policy requires it.
14. Confirm status-change notifications are emitted only when the status changes.
15. Force a delay above threshold and confirm a single admin delay alert is sent.
16. Confirm the same delay does not re-emit unexpectedly inside the configured dedupe window.
17. Mark the order as delivered and confirm delay alerts stop immediately.
18. Check the logs page for processed orders, sent notifications, and errors.

## Negative Checks

- Re-run the same poll twice and confirm no duplicate records or duplicate notifications are created.
- Change only non-status fields and confirm status-change notifications do not fire.
- Set delay below threshold and confirm no admin alert is sent.
- Disable a delivery type for a store and confirm that type no longer routes notifications.

## Release Gate

- Confirm no failing tests in the QA suite.
- Confirm the cron endpoint is protected.
- Confirm manual notification delivery works for at least one store and one delivery type.
- Confirm no remaining references to scraping-based logic in the notification path.
