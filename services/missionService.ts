import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase/client";

export const missionTrackSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  available_count: z.number().int().nonnegative(),
  practiced_count: z.number().int().nonnegative(),
  active_session_id: z.uuid().nullable(),
  sections: z.array(
    z.object({
      topic_id: z.uuid(),
      title: z.string(),
      chapter_title: z.string(),
      chapter_number: z.number().int().positive().nullable(),
      module_number: z.number().int().positive().nullable(),
      module_title: z.string().nullable(),
      available_count: z.number().int().positive(),
      practiced_count: z.number().int().nonnegative(),
    }),
  ),
});
export type MissionTrack = z.infer<typeof missionTrackSchema>;

export const studentMissionsSchema = z.object({
  today_count: z.number().int().nonnegative(),
  weekly_count: z.number().int().nonnegative(),
  weekly_goal: z.union([z.literal(25), z.literal(50), z.literal(100)]),
  local_date: z.string(),
  active_session_id: z.uuid().nullable(),
  exams: z.array(
    z.object({ id: z.uuid(), title: z.string(), available_count: z.number().int().nonnegative() }),
  ),
});

export async function fetchStudentMissions() {
  const client = getSupabaseClient();
  const [mission, tracks] = await Promise.all([
    client.rpc("get_student_missions", {
      p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    }),
    client.rpc("get_student_mission_tracks"),
  ]);
  if (mission.error) throw mission.error;
  if (tracks.error) throw tracks.error;
  return {
    ...studentMissionsSchema.parse(mission.data),
    exams: z.array(missionTrackSchema).parse(tracks.data),
  };
}

export async function setWeeklyMission(goal: 25 | 50 | 100) {
  const { error } = await getSupabaseClient().rpc("set_student_weekly_mission", { p_goal: goal });
  if (error) throw error;
}
