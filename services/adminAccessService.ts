import {
  adminUserAccessOverviewSchema,
  type AdminUserAccessOverview,
} from "../features/admin/schemas";
import { getSupabaseClient } from "../lib/supabase/client";
import { z } from "zod";

const familyLinksSchema = z.array(
  z.object({
    student_id: z.uuid(),
    relationship_type: z.string(),
    can_view_progress: z.boolean(),
  }),
);

export async function adminFamilyLinks(
  guardianId: string,
  change?: { studentId: string; enabled: boolean },
) {
  const { data, error } = await getSupabaseClient().rpc("admin_family_links", {
    p_guardian_id: guardianId,
    p_student_id: change?.studentId,
    p_enabled: change?.enabled,
  });
  if (error) throw error;
  return familyLinksSchema.parse(data);
}

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
