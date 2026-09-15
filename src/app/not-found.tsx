import { ErrorPage } from "@/components/shared/feedback/error-page"

export default function NotFound() {
  return <ErrorPage statusCode={404} />
}
