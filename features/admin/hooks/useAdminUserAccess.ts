import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAdminUserAccessOverview,
  updateAdminStudentAccess,
} from "../../../services/adminAccessService";

export const adminUserAccessKeys = {
  overview: ["admin-user-access", "overview"] as const,
};

export function useAdminUserAccessOverview() {
  return useQuery({
    queryKey: adminUserAccessKeys.overview,
    queryFn: fetchAdminUserAccessOverview,
  });
}

export function useUpdateAdminStudentAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminStudentAccess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserAccessKeys.overview }),
  });
}
