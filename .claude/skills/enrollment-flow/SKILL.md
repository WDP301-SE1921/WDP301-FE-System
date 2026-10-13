---
name: enrollment-flow
description: Use when implementing or modifying staff registration/enrollment screens or API calls.
user-invocable: false
---

# Enrollment Flow

Registration and payment confirmation belong to **Nhân viên**, under `(staff)`.
Managers prepare classes and schedules; they cannot confirm payments or use staff routes.

## Parent preparation
- A1, first child: the parent downloads the app, registers with email/password and creates a child profile.
- A2, another child: the parent creates another child profile under the same account in the app.
- A3, another subject: reuse the existing child profile.
- Staff never create parent credentials or child profiles on the parent's behalf.

## Shared staff flow
1. Type part of the parent's email; debounce and show matching accounts after 1–2 characters.
2. Explicitly select the correct account, then select one of its existing children.
3. Select subject/grade/class from the class's fixed schedule; package length is 1–12 months.
4. Calculate the fee and confirm only after receiving the full payment.
5. Payment confirmation creates an Enrollment attached immediately to the chosen child.
6. Show the receipt with a Print button; reuse the same receipt component.

There is no invitation credential, link generation, claim step or further parent confirmation.
Keep API field names aligned with the actual BE DTOs. If an endpoint is missing, document
the required contract for BE; never present mock results as real accounts or payments.
