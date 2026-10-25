import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { TrackCoverageCard } from "../features/progress/components/TrackCoverageCard";
import type { MissionTrack } from "../services/missionService";

const track: MissionTrack = {
  id: "af100000-0000-4000-8000-000000000001",
  title: "Billy Mitchell Leadership",
  active_session_id: null,
  available_count: 20,
  practiced_count: 10,
  sections: [1, 2].map((number) => ({
    topic_id: `topic-${number}`,
    title: `Chapter ${number}`,
    chapter_title: `Chapter ${number}`,
    chapter_number: number,
    module_number: null,
    module_title: null,
    available_count: 10,
    practiced_count: number === 1 ? 10 : 0,
  })),
};
it("distinguishes full question coverage from mastery", async () => {
  await render(<TrackCoverageCard track={track} />);
  expect(screen.getByText("1 of 2 chapters fully practiced")).toBeVisible();
  expect(screen.getByText("All questions practiced")).toBeVisible();
  expect(screen.getByText("Not started")).toBeVisible();
  expect(screen.getByText(/coverage, not mastery/)).toBeVisible();
});
it("keeps Aerospace chapters inside expandable module menus", async () => {
  await render(
    <TrackCoverageCard
      track={{
        ...track,
        title: "Billy Mitchell Aerospace",
        sections: track.sections.map((section) => ({
          ...section,
          module_number: 1,
          module_title: "Module 1: Flight",
        })),
      }}
    />,
  );
  expect(screen.queryByText("Chapter 1")).toBeNull();
  await act(() => fireEvent.press(screen.getByLabelText("Module 1: Flight")));
  expect(screen.getByText("Chapter 1")).toBeVisible();
  expect(screen.getByText("Chapter 2")).toBeVisible();
});
