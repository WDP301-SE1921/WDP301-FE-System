import { ErrorPage } from "@/components/shared/feedback/error-page"

export default function ForbiddenPage() {
  return <ErrorPage statusCode={403} />
}
