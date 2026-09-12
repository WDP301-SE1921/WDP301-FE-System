# EduGrade — System Workflow Specification

---

## 1. System Overview & Core Principles

**EduGrade** is a specialized management system designed for a single tutoring center catering to Grades 6, 7, 8, and 9 in Mathematics, Physics, Chemistry, and Biology.

### Key Architectural Constraints & Business Principles
* **Single Center Scope:** Multi-tenant architecture is not supported; all operations pertain to a single center entity.
* **Account Hierarchy:** There are **no separate Student accounts**. Only Parent accounts exist.
  * `1 Parent Account` = Unique Login Email + Password.
  * `1 Parent Account` can manage `N Child Profiles` (Student Records).
  * Students submit assignments through their parent's active login session.
* **No Direct Online Self-Registration or Payment Integration:**
  * Managers handle all course enrollments offline/manually via phone or in-person.
  * Cash and Bank Transfers are collected offline. Payments are recorded only upon explicit Manager confirmation (`Confirm Payment`).
  * Integrations with online payment gateways or thermal receipt printers are strictly excluded.
* **Link / Token Authentication:**
  * Parents construct their account credentials via a secure single-use link/code (valid for 7 days) generated after payment confirmation.
  * Managers never generate, view, or reset passwords for Parents.
* **AI Delegation & Human-in-the-Loop:**
  * AI evaluation (grading/feedback) strictly produces a **draft state**.
  * AI-generated content is **never automatically published** to parents or students without Teacher review and approval.
* **Notifications:**
  * Email is the sole automated communication channel. SMS integrations are excluded.

---

## 2. Table of Contents
1. [Workflow A: Student Registration, Payment & Account Linking](#workflow-a-student-registration-payment--account-linking)
   - [A1: First Child Registration (New Parent Account)](#a1-first-child-registration-new-parent-account)
   - [A2: Subsequent Child Registration (Existing Parent Account)](#a2-subsequent-child-registration-existing-parent-account)
   - [A3: Enrolling an Existing Child in Additional Courses/Classes](#a3-enrolling-an-existing-child-in-additional-coursesclasses)
2. [Workflow B: Class Creation & Automatic Session Generation](#workflow-b-class-creation--automatic-session-generation)
3. [Workflow C: Attendance Tracking & Automated Email Alerts](#workflow-c-attendance-tracking--automated-email-alerts)
4. [Workflow D: Single-Session Absence & Make-up Class Scheduling](#workflow-d-single-session-absence--make-up-class-scheduling)
5. [Workflow E: Single-Session Swap (Pre-Absence Rescheduling)](#workflow-e-single-session-swap-pre-absence-rescheduling)
6. [Workflow F: Permanent Schedule Change (Class Transfer)](#workflow-f-permanent-schedule-change-class-transfer)
7. [Workflow G: Extended Leave of Absence (Temporary Suspension)](#workflow-g-extended-leave-of-absence-temporary-suspension)
8. [Workflow H: Single-Subject Withdrawal & Complete Withdrawal](#workflow-h-single-subject-withdrawal--complete-withdrawal)
9. [Workflow I: AI-Assisted Assignment Evaluation](#workflow-i-ai-assisted-assignment-evaluation)
10. [Workflow J: AI Performance Aggregation & Report Export](#workflow-j-ai-performance-aggregation--report-export)

---

## Workflow A: Student Registration, Payment & Account Linking

### A1: First Child Registration (New Parent Account)

#### Actors:
Center Manager, EduGrade Core Platform, Parent.

#### Preconditions:
* Parent has no pre-existing account on EduGrade (email does not exist in the database).
* In-person or telephone agreement for course selection has occurred offline.

#### Flow Diagram:
```mermaid
sequenceDiagram
    autonumber
    actor Manager as Center Manager
    participant System as EduGrade Platform
    participant Email as Email Service
    actor Parent as Parent

    Manager->>System: Input Child Info + Parent Email/Phone + Subject/Class + Month Duration (1–12)
    System->>Manager: Calculate Fee & Render Confirmation Screen
    Manager->>System: Collect Funds (Offline) & Click "Confirm Payment"
    Note over System: Atomic Transaction Begins
    System->>System: Create Payment Record (STATUS: COMPLETED)
    System->>System: Create Enrollment Record (STATUS: PENDING_LINK)
    System->>System: Generate One-Time Link/Code (Expires in 7 Days, Single-Use)
    System->>Manager: Render Digital Receipt on UI (with Print button)
    System->>Email: Dispatch Email (Receipt + Class Schedule + Unique Link/Code)
    Note over System: Atomic Transaction Ends
    Email-->>Parent: Deliver Email Notification
    Parent->>System: Click Link / Enter Code on Web/Mobile Portal
    System->>Parent: Present Account Creation Form (Set Password)
    Parent->>System: Submit Password Form
    System->>System: Create Parent Account (Email = Username)
    System->>System: Create Child Profile & Bind to Parent Account
    System->>System: Link Pending Enrollment to Child Profile (STATUS: ACTIVE)
    System->>Parent: Confirm Link Success & Display Dashboard