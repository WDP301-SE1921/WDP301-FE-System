# EduGrade — System Workflow Specification

---

## 1. System Overview & Core Principles

**EduGrade** is a specialized management system designed for a single tutoring center catering to Grades 6, 7, 8, and 9 in Mathematics, Physics, Chemistry, and Biology.

### Key Architectural Constraints & Business Principles
* **Single Center Scope:** Multi-tenant architecture is not supported; all operations pertain to a single center entity.
* **Center Roles (web back-office):** five web roles, each with a fixed set of screens (`src/constants/role-access.ts`) — no finer permissions inside a role.
  * `admin` — everything; manages the accounts of all center staff (center manager, curriculum designer, staff, teachers, parents).
  * `center_manager` (Quản lý trung tâm) — CRUD staff / parents / teachers; CRUD curriculum and schedule fixed-weekday classes; assigns teachers to existing fixed classes; business dashboard (tuition, student / teacher / staff counts).
  * `curriculum_designer` (Thiết kế giáo trình) — designs the Math / Physics / Chemistry / Biology curriculum from the textbooks: 1 session = 1 lesson, plus 1 monthly test per month.
  * `staff` (Nhân viên) — registers students, collects tuition, changes a student's schedule, arranges make-up sessions, withdraws students, creates long-term leave.
  * `teacher` — takes attendance (which drives the teacher's work-credit), creates homework, grades with AI; the teaching schedule is fixed by the center (teachers do not supply availability and cannot decline a session).
* **Account Hierarchy:** There are **no separate Student accounts**. Only Parent accounts exist.
  * `1 Parent Account` = Unique Login Email + Password, created by the parent on the mobile app.
  * `1 Parent Account` can manage `N Child Profiles` (Student Records), also created by the parent on mobile.
  * Students submit assignments through their parent's active login session.
* **No Direct Online Payment Integration:**
  * Staff handle all course enrollments at the center or by phone, only for a parent and child profile that already exist on the app.
  * Cash and Bank Transfers are collected offline. Payments are recorded only upon explicit Staff confirmation (`Confirm Payment`).
  * Integrations with online payment gateways or thermal receipt printers are strictly excluded.
* **No Parent Activation Link:** parents self-register on mobile, so there is no activation link / code / token and no `pending_link` state. Centers never create, view, or reset a parent's password. (Web staff accounts are still created through an emailed one-time invitation.)
* **AI Delegation & Human-in-the-Loop:**
  * AI evaluation (grading/feedback) strictly produces a **draft state**.
  * AI-generated content is **never automatically published** to parents or students without Teacher review and approval.
* **Notifications:**
  * Email is the sole automated communication channel. SMS integrations are excluded.

---

## 2. Table of Contents
1. [Workflow A: Student Registration & Payment](#workflow-a-student-registration--payment)
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

## Workflow A: Student Registration & Payment

One flow only. The center builds the supply side first (curriculum → fixed-schedule classes); the parent builds the demand side on the mobile app (account → child profile); staff then joins them.

### Actors:
Curriculum Designer / Center Manager (curriculum + classes, beforehand), Parent (mobile), Staff (or Admin), EduGrade Core Platform.

### Preconditions:
* A curriculum (`Program` + `Lesson`s) exists and a class with a fixed weekly schedule has been created from it.
* The parent has registered a Parent Account on the mobile app and created the child's `StudentProfile` — the profile **must exist beforehand**.
* The parent has agreed on the class by phone or in person ("registers according to the center's schedule").

### Flow Diagram:
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff
    participant System as EduGrade Platform
    participant Email as Email Service
    actor Parent as Parent (mobile)

    Staff->>System: Enter the parent's Gmail
    System->>Staff: Show the parent + their child profiles (none found → tell the parent to register / create the child on the app first)
    Staff->>System: Pick the child → Grade → Subject → Class (fixed schedule; overlap with the child's existing classes is warned)
    Staff->>System: Set Month Duration (1–12); review Fee
    Staff->>System: Collect Funds (Offline) & Click "Confirm Payment"
    Note over System: Atomic Transaction Begins
    System->>System: Create Payment Record (STATUS: SUCCEEDED)
    System->>System: Create Enrollment Record attached to the chosen child (STATUS: ACTIVE)
    System->>Staff: Render Digital Receipt on UI (with Print button)
    System->>Email: Dispatch Email (Receipt + Class Schedule)
    Note over System: Atomic Transaction Ends
    Email-->>Parent: Deliver Email Notification
    Parent->>System: Sees the new class on the child's schedule in the app
```

There is no activation link, code or `PENDING_LINK` state. A staff member never creates a parent or a child on the web; a center manager can only edit / lock / soft-delete parents.