import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { canAccessArea, resolveSignedInRoute, type ProtectedArea } from "../access";
import { useAuth } from "../AuthProvider";
import { AuthStatusScreen } from "./AuthStatusScreen";

type RequireRoleProps = PropsWithChildren<{ area: ProtectedArea }>;

export function RequireRole({ area, children }: RequireRoleProps) {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <AuthStatusScreen title="Loading CAP Mastery" description="Restoring secure access." />;
  }

  if (auth.status === "configuration_missing") {
    return <Redirect href="/" />;
  }

  if (auth.status === "signed_out" || !auth.session) {
    return <Redirect href="/sign-in" />;
  }

  if (auth.status !== "signed_in" || !auth.access) {
    return <Redirect href="/unauthorized" />;
  }

  if (!canAccessArea(auth.access.roles, area)) {
    return <Redirect href={resolveSignedInRoute(auth.access.roles)} />;
  }

  return children;
}
