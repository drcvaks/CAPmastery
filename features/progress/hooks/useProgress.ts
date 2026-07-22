import { useQuery } from "@tanstack/react-query";

import { fetchProgressDashboard, fetchProgressStudents } from "../../../services/progressService";

export const progressQueryKeys = {
  all: ["progress"] as const,
  students: ["progress", "students"] as const,
  dashboard: (studentId: string) => ["progress", "dashboard", studentId] as const,
};

export function useProgressStudents() {
  return useQuery({
    queryKey: progressQueryKeys.students,
    queryFn: fetchProgressStudents,
  });
}

export function useProgressDashboard(studentId?: string) {
  return useQuery({
    queryKey: progressQueryKeys.dashboard(studentId ?? "none"),
    queryFn: () => fetchProgressDashboard(studentId!),
    enabled: Boolean(studentId),
  });
}
