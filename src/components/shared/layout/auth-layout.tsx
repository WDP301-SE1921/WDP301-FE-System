import * as React from "react"

export interface AuthLayoutProps {
  title?: string
  subtitle?: string
  /**
   * Card minh họa hiển thị phía trên tiêu đề ở panel trái. Bỏ trống thì panel chỉ
   * còn logo + tiêu đề + mô tả.
   */
  illustration?: React.ReactNode
  /** Link phụ ở góc phải dòng chân panel trái (vd "Trung tâm hỗ trợ"). */
  footerLink?: React.ReactNode
  children: React.ReactNode
}

function AuthLayout({
  title = "Chào mừng trở lại EduGrade",
  subtitle = "Hệ thống quản lý trung tâm giáo dục tin cậy & chuyên nghiệp",
  illustration,
  footerLink,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Left Branding Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-xl font-black text-primary shadow-md">
              EG
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">
              EduGrade
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          {illustration}

          <div className="space-y-4">
            <h2 className="font-heading text-3xl leading-tight font-extrabold">
              {title}
            </h2>
            <p className="text-base leading-relaxed text-primary-foreground/80">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} EduGrade. All rights reserved.</span>
          {footerLink}
        </div>

        {/* Decorative Background Circles */}
        <div className="pointer-events-none absolute -top-20 -right-20 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-96 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Right Form Container */}
      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-sm">
              EG
            </div>
            <span className="font-heading text-xl font-bold text-foreground">
              EduGrade
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export { AuthLayout }
