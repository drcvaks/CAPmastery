import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { QuestionCsvRow } from "../csv";
import {
  checkImportDuplicates,
  fetchReviewQuestion,
  fetchReviewQueue,
  importQuestionCsv,
  saveReviewQuestion,
  submitQuestionReview,
} from "../../../services/adminContentService";
import type { ReviewEditPayload } from "../schemas";
import {
  fetchTesterQuestion,
  fetchTesterQuestions,
  proposeQuestion,
} from "../../../services/contentTesterService";
import { useOptionalAuth } from "../../auth/AuthContext";

export const contentAdminKeys = {
  queue: ["content-admin", "queue"] as const,
  question: (id: string) => ["content-admin", "question", id] as const,
};

export function useDuplicateCheck() {
  return useMutation({ mutationFn: (rows: QuestionCsvRow[]) => checkImportDuplicates(rows) });
}

export function useQuestionCsvImport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ fileName, rows }: { fileName: string; rows: QuestionCsvRow[] }) =>
      importQuestionCsv(fileName, rows),
    onSuccess: () => client.invalidateQueries({ queryKey: contentAdminKeys.queue }),
  });
}

export function useReviewQueue(tester = false) {
  const userId = useOptionalAuth()?.session?.user.id;
  return useQuery({
    queryKey: [...contentAdminKeys.queue, userId, tester],
    queryFn: tester ? fetchTesterQuestions : fetchReviewQueue,
    staleTime: 0,
  });
}

export function useReviewQuestion(id?: string, tester = false) {
  const userId = useOptionalAuth()?.session?.user.id;
  return useQuery({
    queryKey: [...contentAdminKeys.question(id ?? "none"), userId, tester],
    queryFn: () => (tester ? fetchTesterQuestion(id!) : fetchReviewQuestion(id!)),
    gcTime: tester ? 0 : undefined,
    enabled: Boolean(id),
  });
}

export function useSaveReviewQuestion(id: string, tester = false, updatedAt?: unknown) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payload,
      changeReason,
    }: {
      payload: ReviewEditPayload;
      changeReason: string;
    }) =>
      tester
        ? proposeQuestion(id, payload, changeReason, updatedAt)
        : saveReviewQuestion(id, payload, changeReason),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: contentAdminKeys.queue }),
        client.invalidateQueries({ queryKey: contentAdminKeys.question(id) }),
      ]);
    },
  });
}

export function useSubmitQuestionReview(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof submitQuestionReview>[0], "questionId">) =>
      submitQuestionReview({ ...input, questionId: id }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: contentAdminKeys.queue }),
        client.invalidateQueries({ queryKey: contentAdminKeys.question(id) }),
      ]);
    },
  });
}
