# Security & Permissions

- Login accounts exist for: Quản lý trung tâm, Thiết kế giáo trình, Nhân viên, Giáo viên (all Web, staff-side), and Phụ huynh (Mobile). There is still no student login — ever.
- Route guards per role: a `(manager)`, `(curriculum)`, `(staff)`, or `(teacher)` route must 403 for any session that isn't that exact role — check this on the server (layout/middleware), not just by hiding UI. Staff-side roles are NOT interchangeable: a Nhân viên session must not reach `(manager)` or `(curriculum)` routes and vice versa.
- A parent session must only ever fetch data scoped to their own `StudentProfile` records — never trust a `studentProfileId` from the client without checking it belongs to the authenticated parent.
- **Payment confirmation now belongs to Nhân viên, not Quản lý trung tâm** — update any existing route guard or UI copy that assumed "manager confirms payment".
- Manager can never see another center's data — moot at single-tenant scope today, but don't hardcode assumptions that would make multi-tenant impossible to add later.
- Never log authentication credentials or include access/refresh tokens in browser JSON responses. Parent self-registration never accepts an invitation credential.
