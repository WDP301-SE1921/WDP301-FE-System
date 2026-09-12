---
name: enrollment-flow
description: Use when implementing or modifying any registration/enrollment screen or API call — new child, additional child, or additional subject — for the manager or parent role.
user-invocable: false
---

# Enrollment Flow

Three distinct registration flows exist — implement the correct one, don't generalize into a single form.

## A1 — First child (new parent)
Manager form fields: child name, parent phone, parent email, subject, class, months (1–12).
On submit: create `Payment` → `Enrollment` (status: pending-link) → generate a one-time link (7-day expiry) → send email.
Parent side: the link opens an account-creation form (email pre-filled, read-only) → parent sets a password → `StudentProfile` is created and linked to the `Enrollment` server-side.

## A2 — Additional child (existing parent)
Same manager form, but the email field is a lookup against existing parent accounts. If found, skip account creation entirely on the parent side — the link instead prompts login, then silently creates the new `StudentProfile`.

## A3 — Additional subject/class (existing child)
Manager picks an existing `StudentProfile` from a searchable list (not a fresh name/email form) → subject + class + months only → new `Payment` + `Enrollment` attached to that profile. A link is still generated and emailed — don't skip this step even though the account and profile already exist.

## Shared UI rules
- Every flow ends on the same receipt screen (with a Print button) — reuse one `<Receipt />` component.
- Every flow shows the generated activation link/code to the manager immediately on screen, not only via email.
