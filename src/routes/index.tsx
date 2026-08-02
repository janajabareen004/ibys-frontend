import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, dashboardPathForRole } from "@/context/AuthProvider";
import { LoadingState } from "@/components/feedback/LoadingState";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { status, user } = useAuth();
  if (status === "loading") return <LoadingState />;
  if (status === "authenticated" && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}
