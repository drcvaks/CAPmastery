import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completePracticeTest,
  createPracticeTest,
  fetchPracticeTestOptions,
  fetchPracticeTestResults,
  setPracticeTestPaused,
} from "../../../services/practiceService";
import { studyQueryKeys } from "../../study/hooks/useStudySession";

export const practiceQueryKeys = {
  options: ["practice", "options"] as const,
  results: (sessionId: string) => ["practice", "results", sessionId] as const,
};

export function usePracticeTestOptions() {
  return useQuery({ queryKey: practiceQueryKeys.options, queryFn: fetchPracticeTestOptions });
}

export function useCreatePracticeTest() {
  return useMutation({
    mutationFn: ({ blueprintId, timed }: { blueprintId: string; timed: boolean }) =>
      createPracticeTest(blueprintId, timed),
  });
}

export function useSetPracticeTestPaused(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paused: boolean) => setPracticeTestPaused(sessionId, paused),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyQueryKeys.session(sessionId) }),
  });
}

export function useCompletePracticeTest(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completePracticeTest(sessionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.session(sessionId) }),
        queryClient.invalidateQueries({ queryKey: practiceQueryKeys.results(sessionId) }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
      ]);
    },
  });
}

export function usePracticeTestResults(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: practiceQueryKeys.results(sessionId),
    queryFn: () => fetchPracticeTestResults(sessionId),
    enabled,
  });
}
