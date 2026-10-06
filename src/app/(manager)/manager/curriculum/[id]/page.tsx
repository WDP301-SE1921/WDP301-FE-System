import { CurriculumUnitDetailView } from "@/features/curriculum/components/unit-detail-view";

export default async function CurriculumUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CurriculumUnitDetailView key={id} unitId={id} />;
}
