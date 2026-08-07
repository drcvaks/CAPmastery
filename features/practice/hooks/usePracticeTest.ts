import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completePracticeTest,
  createPracticeTest,
  fetchPracticeTestOptions,
  fetchPracticeTestReviewProgress,
  fetchPracticeTestResults,
  fetchPracticeTestWeakAreas,
  markPracticeAnswerReviewed,
  setPracticeTestQuestionFlag,
  setPracticeTestPaused,
} from "../../../services/practiceService";
import { studyQueryKeys } from "../../study/hooks/useStudySession";

export const practiceQueryKeys = {
  options: ["practice", "options"] as const,
  results: (sessionId: string) => ["practice", "results", sessionId] as const,
  reviewProgress: (sessionId: string) => ["practice", "review-progress", sessionId] as const,
  weakAreas: (sessionId: string) => ["practice", "weak-areas", sessionId] as const,
};

export function usePracticeTestOptions() {
  return useQuery({ queryKey: practiceQueryKeys.options, queryFn: fetchPracticeTestOptions });
}

export function useCreatePracticeTest() {
  return useMutation({
    mutationFn: ({
      blueprintId,
      timed,
      strategy,
    }: {
      blueprintId: string;
      timed: boolean;
      strategy: "fixed_blueprint" | "mitchell_full_exam";
    }) => createPracticeTest(blueprintId, timed, strategy),
  });
}

export function useSetPracticeTestQuestionFlag(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionQuestionId, flagged }: { sessionQuestionId: string; flagged: boolean }) =>
      setPracticeTestQuestionFlag(sessionQuestionId, flagged),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studyQueryKeys.session(sessionId) }),
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
        queryClient.invalidateQueries({ queryKey: practiceQueryKeys.weakAreas(sessionId) }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
      ]);
    },
  });
}

export function usePracticeTestWeakAreas(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: practiceQueryKeys.weakAreas(sessionId),
    queryFn: () => fetchPracticeTestWeakAreas(sessionId),
    enabled,
  });
}

export function usePracticeTestResults(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: practiceQueryKeys.results(sessionId),
    queryFn: () => fetchPracticeTestResults(sessionId),
    enabled,
  });
}

export function usePracticeTestReviewProgress(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: practiceQueryKeys.reviewProgress(sessionId),
    queryFn: () => fetchPracticeTestReviewProgress(sessionId),
    enabled,
  });
}

export function useMarkPracticeAnswerReviewed(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionQuestionId: string) => markPracticeAnswerReviewed(sessionQuestionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewProgress(sessionId) }),
  });
}
