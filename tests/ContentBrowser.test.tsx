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
          id: "20000000-0000-4000-8000-000000000001",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "MITCHELL_LEADERSHIP",
          title: "Billy Mitchell Leadership",
          description: null,
          sort_order: 10,
          topics: [],
        },
        {
          id: "20000000-0000-4000-8000-000000000002",
          program_id: "10000000-0000-4000-8000-000000000001",
          code: "MITCHELL_AEROSPACE",
          title: "Billy Mitchell Aerospace",
          description: null,
          sort_order: 20,
          topics: [topic(3, 30), topic(1, 10), topic(2, 20)],
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
});
