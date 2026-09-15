import * as React from "react"

export interface AuthLayoutProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
}

function AuthLayout({
  title = "Chào mừng trở lại EduGrade",
  subtitle = "Hệ thống quản lý trung tâm giáo dục tin cậy & chuyên nghiệp",
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary font-black text-xl shadow-md">
              EG
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">
              EduGrade
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="font-heading text-3xl font-extrabold leading-tight">
            {title}
          </h2>
          <p className="text-primary-foreground/80 text-base leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} EduGrade. All rights reserved.
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 size-96 rounded-full bg-black/10 blur-3xl pointer-events-none" />
      </div>

      {/* Right Form Container */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-sm">
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
