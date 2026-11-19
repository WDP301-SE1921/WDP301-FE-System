import { connection } from "next/server"
import {
  BenefitsSection,
  CtaSection,
  HeroSection,
  SubjectsSection,
} from "@/features/landing/components"
import { loadLandingData } from "@/features/landing/load-landing"

export default async function LandingPage() {
  // The API may be offline during image builds; read public data when serving a request.
  await connection()
  const data = await loadLandingData()
  return (
    <>
      <HeroSection stats={data.stats} />
      <SubjectsSection subjects={data.subjects} />
      <BenefitsSection />
      <CtaSection contactItems={data.contactItems} />
    </>
  )
}
