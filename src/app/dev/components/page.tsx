"use client"

import * as React from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/shared/layout/app-shell"
import { PageHeader } from "@/components/shared/layout/page-header"
import { PageContainer } from "@/components/shared/layout/page-container"

// Feedback
import { StatusBadge } from "@/components/shared/feedback/status-badge"
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog"
import { EmptyState } from "@/components/shared/feedback/empty-state"
import { ErrorState } from "@/components/shared/feedback/error-state"
import {
  SkeletonTable,
  SkeletonKpiGrid,
  SkeletonDetailHeader,
} from "@/components/shared/feedback/skeleton-presets"

// Display — Phase 2 & 3
import { UserCell } from "@/components/shared/display/user-cell"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { MoneyText } from "@/components/shared/display/money-text"
import { KpiCard } from "@/components/shared/display/kpi-card"

// Pickers & Workflows — Phase 4
import { SelectableCard } from "@/components/shared/pickers/selectable-card"
import { ConditionChips } from "@/components/shared/pickers/condition-chips"
import { ClassOptionCard } from "@/components/shared/pickers/class-option-card"
import { Stepper } from "@/components/shared/workflows/stepper"

// Calendar — Phase 5
import { ScheduleCalendar, type CalendarEvent } from "@/components/shared/calendar/schedule-calendar"
import { SessionDrawer, type SessionDetail } from "@/components/shared/calendar/session-drawer"

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

// Auth events (dev trigger)
import { emitSessionExpired } from "@/lib/auth-events"
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container"

const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Toán 10A — Đại số",
    subject: "MATH",
    date: "2026-09-15",
    time: "08:00 – 10:00",
    room: "P.301",
    teacherName: "Nguyễn Văn An",
    status: "SCHEDULED",
    totalStudents: 24,
    attendedCount: 22,
    absentStudents: [{ id: "st-1", name: "Trần Bảo Nam", reason: "Sốt nhẹ" }],
  },
  {
    id: "evt-2",
    title: "Vật lý 11B — Cơ học",
    subject: "PHYS",
    date: "2026-09-15",
    time: "14:00 – 16:00",
    room: "P.202",
    teacherName: "Trần Thị Bình",
    status: "COMPLETED",
    totalStudents: 20,
    attendedCount: 20,
  },
  {
    id: "evt-3",
    title: "Hóa học 12 — Ôn thi",
    subject: "CHEM",
    date: "2026-09-17",
    time: "18:00 – 20:00",
    room: "P.105",
    teacherName: "Lê Quang Cường",
    status: "SUBSTITUTE",
  },
]

export default function DevComponentsShowcasePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmDefaultOpen, setConfirmDefaultOpen] = React.useState(false)
  const [selectedCard, setSelectedCard] = React.useState("card-1")

  // Calendar Drawer state
  const [selectedSession, setSelectedSession] = React.useState<SessionDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  return (
    <AppShell role="manager">
      <PageContainer maxWidth="7xl">
        <PageHeader
          title="Component Showcase (Dev Mode)"
          description="Trang kiểm thử các thành phần Shared Component — Phase 1 đến Phase 5."
          breadcrumbs={[
            { label: "Hệ thống", href: "/" },
            { label: "Phát triển", href: "/dev/components" },
            { label: "Showcase" },
          ]}
          actions={
            <Button onClick={() => setConfirmOpen(true)} variant="danger" size="sm">
              Xác nhận xóa
            </Button>
          }
        />

        {/* ── Phase 5: Calendar Components ────────────────────────────── */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Phase 5: Calendar Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScheduleCalendar
              events={SAMPLE_EVENTS}
              onEventClick={(evt) => {
                setSelectedSession(evt as SessionDetail)
                setDrawerOpen(true)
              }}
            />
          </CardContent>
        </Card>

        {/* ── Phase 4: Pickers & Workflows ────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Phase 4: Pickers & Workflows</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Stepper</p>
              <Stepper
                currentStep={1}
                steps={[
                  { id: "step-1", title: "Chọn học sinh", description: "Tìm & chọn học sinh" },
                  { id: "step-2", title: "Chọn lớp học", description: "Lớp học phù hợp" },
                  { id: "step-3", title: "Xác nhận & Thanh toán", description: "Tạo hóa đơn" },
                ]}

              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Condition Chips (Read-only)</p>
              <ConditionChips
                conditions={[
                  { id: "1", label: "Cùng chương trình", pass: true },
                  { id: "2", label: "Cùng Bài 13", pass: true },
                  { id: "3", label: "Chưa diễn ra", pass: true },
                  { id: "4", label: "Còn chỗ", pass: false },
                ]}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Selectable Cards</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectableCard
                  selected={selectedCard === "card-1"}
                  onClick={() => setSelectedCard("card-1")}
                  title="Gói 3 tháng (Tích kiệm 10%)"
                  description="Áp dụng cho học sinh mới đăng ký năm 2026."
                />
                <SelectableCard
                  selected={selectedCard === "card-2"}
                  onClick={() => setSelectedCard("card-2")}
                  title="Gói 6 tháng (Tích kiệm 20%)"
                  description="Tặng kèm 2 buổi luyện đề nâng cao."
                  badge="Phổ biến"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Class Option Card</p>
              <ClassOptionCard
                code="CLS-MATH10A"
                subject="MATH"
                teacherName="Nguyễn Văn An"
                schedule="T2, T4 · 08:00–10:00 (P.301)"
                enrolled={22}
                capacity={25}
                fee={1500000}
                selected={true}
                onSelect={() => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Phase 1: Feedback ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Phase 1: Status Badges (constants/status.ts)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Manager / Enrollment / Session / Grading
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="manager" status="active" />
                <StatusBadge category="manager" status="pending" />
                <StatusBadge category="manager" status="disabled" />
                <StatusBadge category="enrollment" status="active" />
                <StatusBadge category="enrollment" status="dropped" />
                <StatusBadge category="session" status="scheduled" />
                <StatusBadge category="grading" status="draft" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Attendance (điểm danh)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="attendance" status="present" />
                <StatusBadge category="attendance" status="absent" />
                <StatusBadge category="attendance" status="made_up" />
                <StatusBadge category="attendance" status="excused" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Student (học sinh)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="student" status="active" />
                <StatusBadge category="student" status="paused" />
                <StatusBadge category="student" status="withdrawn" />
                <StatusBadge category="student" status="pending_link" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Parent Account (tài khoản phụ huynh)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="parentAccount" status="activated" />
                <StatusBadge category="parentAccount" status="pending_link" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Link Code (mã liên kết)
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="linkCode" status="active" />
                <StatusBadge category="linkCode" status="used" />
                <StatusBadge category="linkCode" status="expired" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Email
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge category="email" status="sent" />
                <StatusBadge category="email" status="pending" />
                <StatusBadge category="email" status="failed" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Phase 2: Core Display ────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Phase 2: Core Display</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <UserCell name="Nguyễn Văn An" sub="HS-2024-001" />
              <UserCell name="Trần Thị Bình" sub="GV-2022-019" avatarUrl="https://i.pravatar.cc/80?u=1" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SubjectTag code="MATH" />
              <SubjectTag code="PHYS" />
              <SubjectTag code="CHEM" />
              <SubjectTag code="BIOL" />
            </div>
            <ScheduleText days={[1, 3, 5]} time="08:00–10:00" room="P.301" />
            <MoneyText amount={1500000} />
          </CardContent>
        </Card>

        {/* ── Phase 3: Extended Display & Actions ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Học sinh" value="248" trendLabel="+12 so với tháng trước" trend="up" color="blue" />
          <KpiCard title="Lớp đang mở" value="18" color="green" />
          <KpiCard title="Doanh thu tháng" value="42.6M" trend="up" trendLabel="+8%" color="amber" />
          <KpiCard title="Vắng không phép" value="7" trend="down" trendLabel="−3 so với tuần trước" color="red" />
        </div>

        {/* ── PROMPT 16: Toast triggers ─────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Toast (sonner)</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => toast.success("Xác nhận thanh toán thành công")}
            >
              Toast thành công
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Không thể tải dữ liệu")}
            >
              Toast lỗi
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.warning("Đã xác nhận thanh toán nhưng gửi email thất bại", {
                  action: { label: "Gửi lại", onClick: () => {} },
                })
              }
            >
              Toast cảnh báo
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("AI đang chấm bài, bạn sẽ nhận thông báo khi xong")
              }
            >
              Toast thông tin
            </Button>
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Alert, 4 variants ──────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Alert — 4 variants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="success">
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>Xác nhận thanh toán thành công.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Cảnh báo</AlertTitle>
              <AlertDescription>
                Đã xác nhận thanh toán nhưng gửi email thất bại.
              </AlertDescription>
            </Alert>
            <Alert variant="danger">
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>Không thể tải dữ liệu.</AlertDescription>
            </Alert>
            <Alert variant="info">
              <AlertTitle>Thông tin</AlertTitle>
              <AlertDescription>
                AI đang chấm bài, bạn sẽ nhận thông báo khi xong.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Skeleton presets ───────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Skeleton Presets</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SkeletonDetailHeader />
            <SkeletonKpiGrid count={4} />
            <SkeletonTable rows={3} cols={4} />
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Empty state, both variants ─────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Empty State</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EmptyState variant="no-data" actionLabel="Tạo lớp" onAction={() => {}} />
            <EmptyState variant="no-result" actionLabel="Xóa bộ lọc" onAction={() => {}} />
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Error state ─────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Error State</CardTitle></CardHeader>
          <CardContent>
            <ErrorState onRetry={() => {}} />
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Confirm dialog, both variants ──────────────────── */}
        <Card>
          <CardHeader><CardTitle>Confirm Dialog</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Xác nhận xóa (danger)
            </Button>
            <Button variant="outline" onClick={() => setConfirmDefaultOpen(true)}>
              Xác nhận lưu thay đổi (default)
            </Button>
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Button variants row ────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Button Variants</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Đang xử lý</Button>
            <Button disabled>Vô hiệu hóa</Button>
          </CardContent>
        </Card>

        {/* ── PROMPT 16: Input states ────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Input States</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Mặc định</p>
              <Input placeholder="Nhập nội dung" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Lỗi</p>
              <Input placeholder="Nhập email" error defaultValue="khong-hop-le" />
              <p className="text-xs text-destructive">Email không hợp lệ</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Vô hiệu hóa</p>
              <Input placeholder="Không thể chỉnh sửa" disabled />
            </div>
          </CardContent>
        </Card>

        {/* ── PROMPT 16C: Session Expired overlay trigger ───────────────── */}
        <Card>
          <CardHeader><CardTitle>Session Expired Modal</CardTitle></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => emitSessionExpired()}>
              Giả lập phiên đăng nhập hết hạn
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Session Drawer */}
        <SessionDrawer
          session={selectedSession}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* Confirm Dialog — danger */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={() => alert("Đã xác nhận xóa!")}
          variant="danger"
          title="Xác nhận xóa danh mục"
          description="Bạn có chắc chắn muốn xóa danh mục này khỏi hệ thống?"
        />

        {/* Confirm Dialog — default */}
        <ConfirmDialog
          open={confirmDefaultOpen}
          onOpenChange={setConfirmDefaultOpen}
          onConfirm={() => alert("Đã lưu thay đổi!")}
          variant="default"
          title="Xác nhận lưu thay đổi"
          description="Các thay đổi sẽ được áp dụng ngay lập tức."
        />
      </PageContainer>

      {/* Trang này không nằm trong (manager)/layout.tsx nên phải tự mount container
          — nơi khác dùng chung layout đã mount ở đó, xem app/(manager)/layout.tsx. */}
      <SessionExpiredModalContainer />
    </AppShell>
  )
}
