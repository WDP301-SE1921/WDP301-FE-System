import {
  BenefitsSection,
  CtaSection,
  HeroSection,
  SubjectsSection,
} from "@/features/landing/components"
import { loadLandingData } from "@/features/landing/load-landing"

export default async function LandingPage() {
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
