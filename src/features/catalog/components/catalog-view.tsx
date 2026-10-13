"use client"

import { parseAsString, useQueryState } from "nuqs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PageHeader } from "@/components/shared/layout/page-header"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { ROUTES } from "@/constants/routes"
import { GradesTab } from "@/features/catalog/components/grades-tab"
import { ProgramsTab } from "@/features/catalog/components/programs-tab"
import { RoomsTab } from "@/features/catalog/components/rooms-tab"
import { SubjectsTab } from "@/features/catalog/components/subjects-tab"

const TABS = [
  { value: "subjects", label: CATALOG_MSG.TAB_SUBJECTS },
  { value: "grades", label: CATALOG_MSG.TAB_GRADES },
  { value: "programs", label: CATALOG_MSG.TAB_PROGRAMS },
  { value: "rooms", label: CATALOG_MSG.TAB_ROOMS },
] as const

function CatalogView() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("programs"))

  return (
    <PageContainer>
      <PageHeader
        title={CATALOG_MSG.PAGE_TITLE}
        description={CATALOG_MSG.PAGE_DESC}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.MANAGER.DASHBOARD },
          { label: CATALOG_MSG.PAGE_TITLE },
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

      {tab === "subjects" && <SubjectsTab />}
      {tab === "grades" && <GradesTab />}
      {tab === "programs" && <ProgramsTab />}
      {tab === "rooms" && <RoomsTab />}
    </PageContainer>
  )
}

export { CatalogView }
