import { getSupabaseClient } from "../lib/supabase/client";
import {
  progressOverviewSchema,
  progressStudentSchema,
  progressTrendSchema,
  topicProgressSchema,
  type ExamProgress,
  type ProgressStudent,
} from "../features/progress/schemas";
import { z } from "zod";

export async function fetchProgressStudents(): Promise<ProgressStudent[]> {
  const { data, error } = await getSupabaseClient().rpc("get_progress_students");
  if (error) throw error;
  return z.array(progressStudentSchema).parse(data);
}

export async function fetchProgressDashboard(studentId: string): Promise<ExamProgress[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("get_progress_dashboard", {
    p_student_id: studentId,
  });
  if (error) throw error;
  const overviews = z.array(progressOverviewSchema).parse(data);

  return Promise.all(
    overviews.map(async (overview) => {
      const [topicsResult, trendsResult] = await Promise.all([
        client.rpc("get_topic_progress", {
          p_student_id: studentId,
          p_exam_id: overview.exam_id,
        }),
        client.rpc("get_progress_trends", {
          p_student_id: studentId,
          p_exam_id: overview.exam_id,
          p_days: 30,
        }),
      ]);
      if (topicsResult.error) throw topicsResult.error;
      if (trendsResult.error) throw trendsResult.error;
      return {
        ...overview,
        topics: z.array(topicProgressSchema).parse(topicsResult.data),
        trends: z.array(progressTrendSchema).parse(trendsResult.data),
      };
    }),
  );
}
