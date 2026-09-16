import { render, screen, userEvent } from "@testing-library/react-native";

import { ContentBrowser } from "../features/content/components/ContentBrowser";
import {
  useApprovedQuestionPreviews,
  useContentCatalog,
} from "../features/content/hooks/useContentCatalog";
import { useCreateStudySession } from "../features/study/hooks/useStudySession";

jest.mock("../features/content/hooks/useContentCatalog", () => ({
  useApprovedQuestionPreviews: jest.fn(),
  useContentCatalog: jest.fn(),
}));
jest.mock("../features/study/hooks/useStudySession", () => ({
  useCreateStudySession: jest.fn(),
}));
jest.mock("../features/practice/components/PracticeTestLauncher", () => ({
  PracticeTestLauncher: () => null,
}));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: jest.fn() }),
}));

const topic = (chapterNumber: number, sortOrder: number) => ({
  id: `40000000-0000-4000-8000-00000000010${chapterNumber}`,
  exam_id: "20000000-0000-4000-8000-000000000002",
  volume_id: "50000000-0000-4000-8000-000000000001",
  chapter_id: `60000000-0000-4000-8000-00000000010${chapterNumber}`,
  code: `AD_M1_C${chapterNumber}`,
  title: `Aerospace Dimensions, Module 1, Chapter ${chapterNumber}`,
  description: null,
  sort_order: sortOrder,
  volume: {
    id: "50000000-0000-4000-8000-000000000001",
    code: "AD_M1",
    title: "Aerospace Dimensions, Module 1: Introduction to Flight",
    sort_order: 10,
  },
  chapter: {
    id: `60000000-0000-4000-8000-00000000010${chapterNumber}`,
    code: `AD_M1_C${chapterNumber}`,
    title: ["Flight", "To Fly by the Lifting Power of Rising Air", "Balloons"][chapterNumber - 1],
    sort_order: sortOrder,
  },
});

describe("ContentBrowser", () => {
  beforeEach(() => {
    jest.mocked(useContentCatalog).mockReturnValue({
      data: [
        {
          id: "20000000-0000-4000-8000-000000000003",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "WRIGHT_BROTHERS",
          title: "Wright Brothers",
          description: null,
          sort_order: 10,
          topics: [
            {
              ...topic(1, 10),
              id: "40000000-0000-4000-8000-000000000301",
              exam_id: "20000000-0000-4000-8000-000000000003",
              code: "LTL1_C1",
              title: "Learn to Lead, Volume 1, Chapter 1",
              volume: { ...topic(1, 10).volume, code: "LTL_V1", title: "Learn to Lead, Volume 1" },
              chapter: {
                ...topic(1, 10).chapter,
                code: "LTL_V1_C1",
                title: "Character and the Air Force Tradition",
              },
            },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000001",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "MITCHELL_LEADERSHIP",
          title: "Billy Mitchell Leadership",
          description: null,
          sort_order: 20,
          topics: [],
        },
        {
          id: "20000000-0000-4000-8000-000000000002",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "MITCHELL_AEROSPACE",
          title: "Billy Mitchell Aerospace",
          description: null,
          sort_order: 30,
          topics: [topic(3, 30), topic(1, 10), topic(2, 20)],
        },
        {
          id: "20000000-0000-4000-8000-000000000004",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "EARHART_LEADERSHIP",
          title: "Earhart Leadership",
          description: null,
          sort_order: 40,
          topics: [
            {
              ...topic(9, 90),
              id: "40000000-0000-4000-8000-000000000409",
              exam_id: "20000000-0000-4000-8000-000000000004",
              code: "LTL3_C9",
              title: "Learn to Lead, Volume 3, Chapter 9",
              volume: { ...topic(9, 90).volume, code: "LTL_V3", title: "Learn to Lead, Volume 3" },
              chapter: {
                ...topic(9, 90).chapter,
                code: "LTL_V3_C9",
                title: "The Cadet Officer",
              },
            },
            {
              ...topic(10, 100),
              id: "40000000-0000-4000-8000-000000000410",
              exam_id: "20000000-0000-4000-8000-000000000004",
              code: "LTL3_C10",
              title: "Learn to Lead, Volume 3, Chapter 10",
              volume: {
                ...topic(10, 100).volume,
                code: "LTL_V3",
                title: "Learn to Lead, Volume 3",
              },
              chapter: {
                ...topic(10, 100).chapter,
                code: "LTL_V3_C10",
                title: "The Staff Officer",
              },
            },
            {
              ...topic(11, 110),
              id: "40000000-0000-4000-8000-000000000411",
              exam_id: "20000000-0000-4000-8000-000000000004",
              code: "LTL3_C11",
              title: "Learn to Lead, Volume 3, Chapter 11",
              volume: {
                ...topic(11, 110).volume,
                code: "LTL_V3",
                title: "Learn to Lead, Volume 3",
              },
              chapter: {
                ...topic(11, 110).chapter,
                code: "LTL_V3_C11",
                title: "The Leader as Commander",
              },
            },
          ],
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);
    jest.mocked(useApprovedQuestionPreviews).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as never);
    jest.mocked(useCreateStudySession).mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: jest.fn(),
    } as never);
  });

  it("expands Aerospace modules into ordered chapter controls", async () => {
    const user = userEvent.setup();
    await render(<ContentBrowser />);
    await user.press(screen.getByText("Billy Mitchell Aerospace"));

    expect(screen.getByText("Module 1")).toBeTruthy();
    expect(screen.queryByText("Chapter 1: Flight")).toBeNull();

    await user.press(screen.getByText("Module 1"));

    const chapterLabels = screen
      .getAllByText(/^Chapter \d:/)
      .map((element) => String(element.props.children));
    expect(chapterLabels).toEqual([
      "Chapter 1: Flight",
      "Chapter 2: To Fly by the Lifting Power of Rising Air",
      "Chapter 3: Balloons",
    ]);
    expect(screen.queryByText("Aerospace content coming soon")).toBeNull();
    expect(screen.queryByText("Leadership content coming soon")).toBeNull();
  });

  it("shows Wright Brothers first and keeps Volume 1 Chapter 1 in that track", async () => {
    await render(<ContentBrowser />);

    expect(screen.getAllByText("Wright Brothers")).toHaveLength(2);
    expect(screen.getByText("Learn to Lead, Volume 1, Chapter 1")).toBeTruthy();
  });

  it("shows Earhart Leadership as its own chapter-based study track", async () => {
    const user = userEvent.setup();
    await render(<ContentBrowser />);

    await user.press(screen.getByText("Earhart Leadership"));

    expect(screen.getAllByText("Earhart Leadership")).toHaveLength(2);
    expect(screen.getByText("Learn to Lead, Volume 3, Chapter 9")).toBeTruthy();
    expect(screen.getByText("Learn to Lead, Volume 3, Chapter 10")).toBeTruthy();
    expect(screen.getByText("Learn to Lead, Volume 3, Chapter 11")).toBeTruthy();
  });
});
