import { crossedMissionCheckpoint, nextMissionCheckpoint } from "../features/progress/missions";

describe("mission checkpoints", () => {
  it("gives the next achievable checkpoint and stops after twenty", () => {
    expect(nextMissionCheckpoint(0)?.count).toBe(5);
    expect(nextMissionCheckpoint(6)?.count).toBe(10);
    expect(nextMissionCheckpoint(10)?.count).toBe(20);
    expect(nextMissionCheckpoint(20)).toBeUndefined();
  });
  it("celebrates only a newly crossed checkpoint, never a duplicate answer", () => {
    expect(crossedMissionCheckpoint(4, 5)?.title).toBe("Quick Win");
    expect(crossedMissionCheckpoint(9, 10)?.title).toBe("Mission Started");
    expect(crossedMissionCheckpoint(19, 20)?.title).toBe("Strong Session");
    expect(crossedMissionCheckpoint(5, 5)).toBeUndefined();
    expect(crossedMissionCheckpoint(5, 6)).toBeUndefined();
  });
});
