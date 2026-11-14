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
      <HeroSection />
      <SubjectsSection />
      <BenefitsSection />
      <CtaSection contactItems={data.contactItems} />
    </>
  )
}
