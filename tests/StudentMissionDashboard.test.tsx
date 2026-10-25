import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StudentMissionDashboard } from "../features/progress/components/StudentMissionDashboard";
import {
  useStudentMissions,
  useSetWeeklyMission,
} from "../features/progress/hooks/useStudentMissions";
import { useCreateStudySession } from "../features/study/hooks/useStudySession";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/home",
}));
jest.mock("../features/progress/hooks/useStudentMissions", () => ({
  useStudentMissions: jest.fn(),
  useSetWeeklyMission: jest.fn(),
}));
jest.mock("../features/study/hooks/useStudySession", () => ({ useCreateStudySession: jest.fn() }));
jest.mock("../features/auth/components/SignOutButton", () => ({ SignOutButton: () => null }));
jest.mock("../features/auth/components/WorkspaceSwitcher", () => ({
  WorkspaceSwitcher: () => null,
}));
const saveGoal = jest.fn().mockResolvedValue(undefined);
const launch = jest.fn().mockResolvedValue("new-session");
const data = {
  today_count: 6,
  weekly_count: 32,
  weekly_goal: 50,
  active_session_id: "af400000-0000-4000-8000-000000000001",
  exams: [
    {
      id: "exam-1",
      title: "Billy Mitchell Aerospace",
      available_count: 100,
      practiced_count: 10,
      active_session_id: "af400000-0000-4000-8000-000000000001",
      sections: [
        {
          topic_id: "topic-1",
          title: "Module 1, Chapter 1",
          chapter_title: "Flight",
          module_number: 1,
          module_title: "Module 1: Introduction to Flight",
          available_count: 100,
          practiced_count: 10,
        },
      ],
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useStudentMissions)
    .mockReturnValue({ data, isPending: false, isError: false } as never);
  jest.mocked(useSetWeeklyMission).mockReturnValue({ mutateAsync: saveGoal } as never);
  jest.mocked(useCreateStudySession).mockReturnValue({ mutateAsync: launch } as never);
});
it("shows small next steps and resumes an existing mission", async () => {
  await render(<StudentMissionDashboard />);
  expect(screen.getByText("6 / 10 complete")).toBeVisible();
  expect(screen.getByText("4 more questions → Mission Started")).toBeVisible();
  expect(screen.getByText("18 questions to complete your weekly mission")).toBeVisible();
  expect(screen.getByText("Choose your study track")).toBeVisible();
  expect(screen.getByText("Current track: Billy Mitchell Aerospace")).toBeVisible();
  await act(() => fireEvent.press(screen.getByText("Continue Billy Mitchell Aerospace mission")));
  expect(mockPush).toHaveBeenCalledWith(`/study/session/${data.active_session_id}`);
  await act(() => fireEvent.press(screen.getByText("Light · 25")));
  expect(saveGoal).toHaveBeenCalledWith(25);
});
it("offers a five-question mission and celebrates completed daily work", async () => {
  jest.mocked(useStudentMissions).mockReturnValue({
    data: {
      ...data,
      today_count: 10,
      active_session_id: null,
      exams: data.exams.map((exam) => ({ ...exam, active_session_id: null })),
    },
    isPending: false,
    isError: false,
  } as never);
  await render(<StudentMissionDashboard />);
  expect(screen.getByText("Mission Complete!")).toBeVisible();
  await act(() => fireEvent.press(screen.getByText("5 questions")));
  await act(() => fireEvent.press(screen.getByText("Start another mission")));
  expect(launch).toHaveBeenCalledWith({ examId: "exam-1", questionCount: 5 });
});

it("keeps separate resumable missions when changing tracks", async () => {
  const leadership = {
    ...data.exams[0],
    id: "exam-2",
    title: "Billy Mitchell Leadership",
    active_session_id: "leadership-session",
    sections: [],
  };
  jest.mocked(useStudentMissions).mockReturnValue({
    data: { ...data, exams: [...data.exams, leadership] },
    isPending: false,
    isError: false,
  } as never);
  await render(<StudentMissionDashboard />);
  await act(() => fireEvent.press(screen.getByText("Billy Mitchell Leadership")));
  expect(screen.getByText("Current track: Billy Mitchell Leadership")).toBeVisible();
  await act(() => fireEvent.press(screen.getByText("Continue Billy Mitchell Leadership mission")));
  expect(mockPush).toHaveBeenLastCalledWith("/study/session/leadership-session");
  await act(() => fireEvent.press(screen.getByText("Billy Mitchell Aerospace")));
  await act(() => fireEvent.press(screen.getByText("Continue Billy Mitchell Aerospace mission")));
  expect(mockPush).toHaveBeenLastCalledWith(`/study/session/${data.active_session_id}`);
});

it("starts Leadership even when an Aerospace mission is unfinished", async () => {
  const leadership = {
    ...data.exams[0],
    id: "exam-2",
    title: "Billy Mitchell Leadership",
    active_session_id: null,
    sections: [],
  };
  jest.mocked(useStudentMissions).mockReturnValue({
    data: { ...data, exams: [...data.exams, leadership] },
    isPending: false,
    isError: false,
  } as never);
  await render(<StudentMissionDashboard />);
  await act(() => fireEvent.press(screen.getByText("Billy Mitchell Leadership")));
  await act(() => fireEvent.press(screen.getByText("Start Mission")));
  expect(launch).toHaveBeenCalledWith({ examId: "exam-2", questionCount: 10 });
});
