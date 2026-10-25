import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStudentMissions, setWeeklyMission } from "../../../services/missionService";
import { useOptionalAuth } from "../../auth/AuthContext";

export function useStudentMissions() {
  const auth = useOptionalAuth();
  const studentId = auth?.session?.user.id;
  return useQuery({
    queryKey: ["progress", "missions", studentId],
    enabled: Boolean(studentId && auth?.access?.roles.includes("student")),
    queryFn: fetchStudentMissions,
    staleTime: 0,
    refetchInterval: 60_000,
  });
}

export function useSetWeeklyMission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: setWeeklyMission,
    onSuccess: () => client.invalidateQueries({ queryKey: ["progress", "missions"] }),
  });
}
