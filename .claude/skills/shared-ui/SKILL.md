---
name: shared-ui
description: Patterns for building and reusing shared UI components (ChildSwitcher, EmptyState, StatusBadge, etc.) across roles.
user-invocable: false
---

# Shared UI Patterns & Component Standards

## 1. Core Principles
* **Primitive Reuse First:** Always import base components from `src/components/ui/` (`Button`, `Card`, `Dialog`, `Table`, `Badge`, `Tabs`, `Input`). Never write inline raw Tailwind tags for these core UI elements.
* **Semantic Styling:** Use semantic CSS variables (`bg-background`, `text-foreground`, `bg-primary`, `text-destructive`) instead of hardcoded color hexes or raw arbitrary classes.
* **Responsive Layouts:** All components under `src/components/shared/` must support both Desktop (Manager Dashboard) and Mobile views (Parent/Teacher mobile portals).

---

## 2. Shared Components & Patterns

### Child Switcher (Parent Role)
Horizontal avatar/tab list at the top of parent screens. 
* Reads the list of `StudentProfile` for the logged-in parent account.
* **State Management:** Switching sets the active child in URL query state using `nuqs` (e.g., `?childId=...`), NOT local component state, so deep links stay shareable.

### Status Badges
Always use a single, centralized `<StatusBadge status={...} />` component.
* Maps every domain status (`AttendanceStatus`, `EnrollmentStatus`, AI-grading status) to a consistent color palette + display label.
* **Rule:** Do NOT hand-roll inline `<span className="...">` badges on individual screens.

### Universal List States (Empty / Loading / Error)
Every list or table view MUST use the three shared system state components — never render plain text like "Loading..." or leave a blank screen:
* `<LoadingSkeleton />`: Renders skeleton shapes matching the expected content layout.
* `<EmptyState title="..." description="..." action="..." />`: Displayed when data array is empty.
* `<ErrorState message="..." onRetry={...} />`: Displayed on API or network fetch failures.

### Form Handling
All forms across the system MUST follow a unified pattern:
* Use `react-hook-form` combined with `@hookform/resolvers/zod`.
* Pair strictly with the matching Zod validation schema imported from `src/lib/validators/`.
* **Rule:** No manually-managed React `useState` for form fields.

---

## 3. Code Example & Implementation Guidance

### Class Name Utility
Always merge dynamic class names using the `cn()` utility from `src/lib/utils.ts`:

```tsx
import { cn } from "@/lib/utils";

export function CustomCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("rounded-xl border bg-card p-6 shadow-sm text-card-foreground", className)} 
      {...props} 
    />
  );
}