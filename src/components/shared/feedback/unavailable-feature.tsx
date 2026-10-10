import Link from "next/link";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export function UnavailableFeature({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <PageContainer>
      <PageHeader title={title} />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p>{description}</p>
          {href && (
            <Button variant="outline" render={<Link href={href} />}>
              {actionLabel ?? "Quay lại"}
            </Button>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
