# Customer User Journey QA Plan

## Goal
Validate the core user experience for the Chant Counter app from a customer perspective: sign in, start a session, count chants, and track progress against a daily goal.

## Customer journeys covered

### 1. First-time app access
- User opens the app.
- They see the auth screen.
- If Firebase is unavailable, the app shows demo mode.
- User can continue as a guest.

### 2. Counting a chant session
- User joins as a guest.
- The counter screen loads.
- User taps the main button to increment the count.
- The counter updates live.

### 3. Daily goal tracking
- User updates the daily goal value.
- The ring and milestone logic reflect the new goal.
- The main count continues to track progress toward that goal.

## Acceptance criteria
- The app loads without crashing in demo mode.
- A guest user can access the counting UI.
- The tap button increments the session count correctly.
- A custom goal can be entered and saved locally.
- User-facing errors and loading states are understandable.

## Automated tests implemented
- Demo-mode login screen renders.
- Guest login navigates to the counter view.
- Repeated taps increase the visible counter value.
- Goal input accepts a custom daily target.

## Run locally
```bash
npm install
npm test
```
