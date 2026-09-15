import * as React from "react"
import { cn } from "cn"

export interface PrintLayoutProps {
  /** Header shown at the top of the print page (e.g. center logo + title) */
  header?: React.ReactNode
  /** Footer shown at the bottom of each print page */
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Print-only layout wrapper.
 * - Renders normally on screen (transparent).
 * - On print (`@media print`), hides everything else via Tailwind `print:` utilities.
 *
 * Usage: wrap `<PrintLayout>` around any content you want printed;
 * trigger `window.print()` via a separate button outside this component.
 */
function PrintLayout({ header, footer, children, className }: PrintLayoutProps) {
  return (
    <div
      className={cn(
        // Screen: invisible wrapper
        "print:block print:p-8 print:text-black print:bg-white",
        className
      )}
    >
      {header && (
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
          {header}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="hidden print:block mt-6 border-t border-gray-300 pt-4 text-xs text-gray-500">
          {footer}
        </div>
      )}
    </div>
  )
}

export { PrintLayout }
