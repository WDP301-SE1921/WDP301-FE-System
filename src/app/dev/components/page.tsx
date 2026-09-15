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
import { LoadingOverlay } from "@/components/shared/feedback/loading-overlay"
import { SkeletonTable, SkeletonKpiGrid } from "@/components/shared/feedback/skeleton-presets"

// Display — Phase 2 & 3
import { UserCell } from "@/components/shared/display/user-cell"
import { SubjectTag } from "@/components/shared/display/subject-tag"
import { ScheduleText } from "@/components/shared/display/schedule-text"
import { MoneyText } from "@/components/shared/display/money-text"
import { DateText } from "@/components/shared/display/date-text"
import { ProgressStat } from "@/components/shared/display/progress-stat"
import { CountdownBadge } from "@/components/shared/display/countdown-badge"
import { KpiCard } from "@/components/shared/display/kpi-card"
import { SectionCard } from "@/components/shared/display/section-card"
import { DetailHeader } from "@/components/shared/display/detail-header"
import { DescriptionList } from "@/components/shared/display/description-list"
import { Timeline } from "@/components/shared/display/timeline"
import { ChangeDiff } from "@/components/shared/display/change-diff"
import { AvatarGroupDisplay } from "@/components/shared/display/avatar-group-display"
import { CodeDisplay } from "@/components/shared/display/code-display"
import { AttendanceSummary } from "@/components/shared/display/attendance-summary"

// Actions — Phase 3
import { CopyButton } from "@/components/shared/actions/copy-button"
import { ExportButton } from "@/components/shared/actions/export-button"

// Pickers & Workflows — Phase 4
import { SelectableCard } from "@/components/shared/pickers/selectable-card"
import { ConditionChips } from "@/components/shared/pickers/condition-chips"
import { ClassOptionCard } from "@/components/shared/pickers/class-option-card"
import { SessionOptionList } from "@/components/shared/pickers/session-option-list"
import { Stepper } from "@/components/shared/workflows/stepper"

// Calendar — Phase 5
import { ScheduleCalendar, type CalendarEvent } from "@/components/shared/calendar/schedule-calendar"
import { SessionDrawer, type SessionDetail } from "@/components/shared/calendar/session-drawer"

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
  const [loadingOverlay, setLoadingOverlay] = React.useState(false)
  const [selectedCard, setSelectedCard] = React.useState("card-1")

  // Calendar Drawer state
  const [selectedSession, setSelectedSession] = React.useState<SessionDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const pastDate = new Date("2025-01-15T08:30:00")

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
          <CardContent className="flex flex-wrap gap-2">
            <StatusBadge category="manager" status="active" />
            <StatusBadge category="manager" status="pending" />
            <StatusBadge category="manager" status="disabled" />
            <StatusBadge category="attendance" status="present" />
            <StatusBadge category="attendance" status="absent" />
            <StatusBadge category="attendance" status="makeup" />
            <StatusBadge category="enrollment" status="active" />
            <StatusBadge category="enrollment" status="dropped" />
            <StatusBadge category="session" status="scheduled" />
            <StatusBadge category="grading" status="draft" />
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

        {/* Calendar Session Drawer */}
        <SessionDrawer
          session={selectedSession}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={() => alert("Đã xác nhận xóa!")}
          variant="danger"
          title="Xác nhận xóa danh mục"
          description="Bạn có chắc chắn muốn xóa danh mục này khỏi hệ thống?"
        />
      </PageContainer>
    </AppShell>
  )
}
