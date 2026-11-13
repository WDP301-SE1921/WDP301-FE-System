import type { ReactNode } from "react";
import { CardDescription, CardHeader } from "@/components/ui/card";

interface FormPageHeaderProps {
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  titleId?: string;
  descriptionId?: string;
}

/** The page title of a standalone form, using the same hierarchy as sign in. */
export function FormPageHeader({
  title,
  description,
  icon,
  titleId,
  descriptionId,
}: FormPageHeaderProps) {
  return (
    <CardHeader className="gap-3">
      {icon && (
        <span
          aria-hidden="true"
          className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          {icon}
        </span>
      )}
      <h1
        id={titleId}
        className="font-heading text-2xl font-semibold tracking-tight text-balance wrap-break-word sm:text-3xl"
      >
        {title}
      </h1>
      <CardDescription id={descriptionId} className="leading-relaxed">
        {description}
      </CardDescription>
    </CardHeader>
  );
}
