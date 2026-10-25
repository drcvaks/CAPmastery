import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createStudySession,
  fetchStudySession,
  submitStudyAnswer,
} from "../../../services/studyService";

export const studyQueryKeys = {
  session: (sessionId: string) => ["study", "session", sessionId] as const,
};

export function useCreateStudySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      topicId,
      questionCount,
    }: {
      examId: string;
      topicId?: string;
      questionCount?: number;
    }) => createStudySession(examId, topicId, questionCount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["progress", "missions"] }),
  });
}

export function useStudySession(sessionId: string) {
  return useQuery({
    queryKey: studyQueryKeys.session(sessionId),
    queryFn: () => fetchStudySession(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useSubmitStudyAnswer(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStudyAnswer,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.session(sessionId) }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
      ]);
    },
  });
}
