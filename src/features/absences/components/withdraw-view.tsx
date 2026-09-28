"use client"

import { parseAsString, useQueryState } from "nuqs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ROUTES } from "@/constants/routes"
import { ReenrollTab } from "./reenroll-tab"
import { WithdrawFullTab } from "./withdraw-full-tab"
import { WithdrawSubjectTab } from "./withdraw-subject-tab"

const TABS = [
  { value: "subject", label: ABSENCE_MSG.TAB_SUBJECT },
  { value: "full", label: ABSENCE_MSG.TAB_FULL },
  { value: "reenroll", label: ABSENCE_MSG.TAB_REENROLL },
] as const

function WithdrawView() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("full"))

  return (
    <PageContainer>
      <PageHeader
        title={ABSENCE_MSG.WITHDRAW_TITLE}
        description={ABSENCE_MSG.WITHDRAW_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: "Nghỉ học & học bù" },
          { label: ABSENCE_MSG.WITHDRAW_TITLE },
        ]}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList className="h-10 rounded-full bg-muted/60 p-1">
          {TABS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="rounded-full px-3.5 py-1 text-xs font-medium data-active:bg-background data-active:shadow-xs"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "subject" && <WithdrawSubjectTab />}
      {tab === "full" && <WithdrawFullTab />}
      {tab === "reenroll" && <ReenrollTab />}
    </PageContainer>
  )
}

export { WithdrawView }
