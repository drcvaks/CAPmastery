import { useQuery } from "@tanstack/react-query";

import {
  fetchApprovedQuestionPreviews,
  fetchContentCatalog,
} from "../../../services/contentService";

export const contentQueryKeys = {
  catalog: ["content", "catalog"] as const,
  approvedQuestions: (examId: string, topicId?: string) =>
    ["content", "approved-questions", examId, topicId ?? "all"] as const,
};

export function useContentCatalog() {
  return useQuery({ queryKey: contentQueryKeys.catalog, queryFn: fetchContentCatalog });
}

export function useApprovedQuestionPreviews(examId?: string, topicId?: string) {
  return useQuery({
    queryKey: contentQueryKeys.approvedQuestions(examId ?? "none", topicId),
    queryFn: () => fetchApprovedQuestionPreviews(examId!, topicId),
    enabled: Boolean(examId),
  });
}
