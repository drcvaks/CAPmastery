import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPrivateChallenge,
  fetchChallengeCreationExams,
  fetchChallengeCreationStudents,
  fetchChallengeEncouragements,
  fetchPrivateChallenges,
  fetchStudentAchievements,
  sendChallengeEncouragement,
} from "../../../services/challengeService";

export const challengeQueryKeys = {
  all: ["challenges"] as const,
  creationStudents: ["challenges", "creation-students"] as const,
  creationExams: (studentIds: string[]) =>
    ["challenges", "creation-exams", [...studentIds].sort()] as const,
  encouragements: (challengeId: string) => ["challenges", challengeId, "encouragements"] as const,
  achievements: (studentId = "self") => ["achievements", studentId] as const,
};

export function usePrivateChallenges() {
  return useQuery({ queryKey: challengeQueryKeys.all, queryFn: fetchPrivateChallenges });
}

export function useChallengeCreationStudents(enabled: boolean) {
  return useQuery({
    queryKey: challengeQueryKeys.creationStudents,
    queryFn: fetchChallengeCreationStudents,
    enabled,
  });
}

export function useChallengeCreationExams(studentIds: string[]) {
  return useQuery({
    queryKey: challengeQueryKeys.creationExams(studentIds),
    queryFn: () => fetchChallengeCreationExams(studentIds),
    enabled: studentIds.length === 2,
  });
}

export function useCreatePrivateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrivateChallenge,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: challengeQueryKeys.all });
    },
  });
}

export function useChallengeEncouragements(challengeId: string) {
  return useQuery({
    queryKey: challengeQueryKeys.encouragements(challengeId),
    queryFn: () => fetchChallengeEncouragements(challengeId),
  });
}

export function useSendChallengeEncouragement(challengeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendChallengeEncouragement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: challengeQueryKeys.encouragements(challengeId),
      });
    },
  });
}

export function useStudentAchievements(enabled: boolean, studentId?: string) {
  return useQuery({
    queryKey: challengeQueryKeys.achievements(studentId),
    queryFn: () => fetchStudentAchievements(studentId),
    enabled,
  });
}
