import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Role } from "@/api/authApi";
import { useAuth } from "@/context/AuthProvider";

/**
 * Client-side role guard for pages under _authenticated.
 * SECURITY: backend MUST also enforce role-based access on every endpoint.
 */
export function RoleGuard({ allow, children }: { allow: Role | Role[]; children: ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(allow)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
