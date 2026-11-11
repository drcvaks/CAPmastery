import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLearningVisuals,
  fetchLearningVisualUrl,
  replaceLearningVisual,
} from "../../../services/adminVisualService";
import { useAuth } from "../../auth/AuthProvider";
import { fetchTesterVisuals, proposeVisual } from "../../../services/contentTesterService";

export function useAdminVisuals(tester = false, enabled = true) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["admin-visuals", session?.user.id, tester],
    enabled,
    queryFn: tester ? fetchTesterVisuals : fetchLearningVisuals,
  });
}
export function useAdminVisualUrl(path: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["admin-visual-url", session?.user.id, path],
    queryFn: () => fetchLearningVisualUrl(path),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
export function useReplaceAdminVisual(tester = false) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: tester ? proposeVisual : replaceLearningVisual,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-visuals"] }),
        client.invalidateQueries({ queryKey: ["study"] }),
      ]);
    },
  });
}
