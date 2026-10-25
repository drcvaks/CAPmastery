export const missionMilestones = [
  { count: 5, title: "Quick Win", message: "You completed 5 questions." },
  { count: 10, title: "Mission Started", message: "Nice work — 10 questions completed." },
  { count: 20, title: "Strong Session", message: "You completed 20 questions this session." },
] as const;

export function nextMissionCheckpoint(count: number) {
  return missionMilestones.find((milestone) => count < milestone.count);
}

export function crossedMissionCheckpoint(before: number, after: number) {
  return [...missionMilestones]
    .reverse()
    .find((milestone) => before < milestone.count && after >= milestone.count);
}
