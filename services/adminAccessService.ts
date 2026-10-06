import {
  adminUserAccessOverviewSchema,
  type AdminUserAccessOverview,
} from "../features/admin/schemas";
import { getSupabaseClient } from "../lib/supabase/client";

export async function fetchAdminUserAccessOverview(): Promise<AdminUserAccessOverview> {
  const { data, error } = await getSupabaseClient().rpc("admin_get_user_access_overview");
  if (error) throw error;
  return adminUserAccessOverviewSchema.parse(data);
}

export async function updateAdminStudentAccess(input: {
  userId: string;
  studentEnabled: boolean;
  importPackages: string[];
}): Promise<void> {
  const { error } = await getSupabaseClient().rpc("admin_update_student_access", {
    p_user_id: input.userId,
    p_student_enabled: input.studentEnabled,
    p_import_packages: input.importPackages,
  });
  if (error) throw error;
}
