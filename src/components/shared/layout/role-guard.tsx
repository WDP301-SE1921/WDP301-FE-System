"use client"

import * as React from "react"
import { ROLES, type Role } from "@/constants/roles"
import { ErrorPage } from "@/components/shared/feedback/error-page"

export interface RoleGuardProps {
  allowedRoles: Role[]
  currentRole?: Role
  children: React.ReactNode
}

function RoleGuard({
  allowedRoles,
  currentRole = ROLES.MANAGER,
  children,
}: RoleGuardProps) {
  const isAllowed = allowedRoles.includes(currentRole)

  if (!isAllowed) {
    return <ErrorPage statusCode={403} />
  }

  return <>{children}</>
}

export { RoleGuard }
