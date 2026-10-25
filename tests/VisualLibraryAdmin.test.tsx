import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { VisualLibraryAdmin } from "../features/admin/components/VisualLibraryAdmin";
import * as hooks from "../features/admin/hooks/useAdminVisuals";
import { pickLearningVisual } from "../services/visualFilePicker";

jest.mock("../features/admin/hooks/useAdminVisuals", () => ({
  useAdminVisuals: jest.fn(),
  useAdminVisualUrl: jest.fn(),
  useReplaceAdminVisual: jest.fn(),
}));
jest.mock("../services/visualFilePicker", () => ({ pickLearningVisual: jest.fn() }));
jest.mock("../features/study/components/VisualAidViewer", () => ({ VisualAidViewer: () => null }));
const visual = {
  asset_key: "c1_guide",
  storage_path: "assets/cap-visuals/guide.png",
  width: 1400,
  height: 1000,
  alt_text: "Core values guide",
  status: "approved",
  updated_at: "2026-10-25",
  locations: [
    {
      exam_id: "20000000-0000-4000-8000-000000000003",
      exam_code: "WRIGHT_BROTHERS",
      exam_title: "Wright Brothers",
      module_number: null,
      chapter_number: 1,
      chapter_title: "Learn to Lead chapter one",
      question_count: 12,
    },
  ],
};
const save = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(hooks.useAdminVisuals).mockReturnValue({
    data: [visual],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  jest
    .mocked(hooks.useAdminVisualUrl)
    .mockReturnValue({ data: "https://example.test/private.png", isError: false } as never);
  jest.mocked(hooks.useReplaceAdminVisual).mockReturnValue({
    mutateAsync: save,
    reset: jest.fn(),
    isPending: false,
    isError: false,
  } as never);
});
it("starts collapsed and opens images within their chapter", async () => {
  await render(<VisualLibraryAdmin />);
  expect(screen.queryByRole("button", { name: "View Core values guide" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Expand Wright Brothers" }));
  expect(hooks.useAdminVisualUrl).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "View Core values guide" }));
  expect(screen.getByText(/12 questions/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Choose replacement PNG" })).toBeVisible();
  await fireEvent.press(screen.getByRole("button", { name: "Back to image library" }));
  expect(screen.getByText("Image library")).toBeVisible();
});
it("requires a chosen file and reason, then explicitly saves the replacement", async () => {
  const file = {
    name: "corrected.png",
    uri: "file:///corrected.png",
    bytes: new Uint8Array(33),
    width: 1400,
    height: 1000,
  };
  jest.mocked(pickLearningVisual).mockResolvedValue(file);
  save.mockResolvedValue(undefined);
  await render(<VisualLibraryAdmin />);
  await fireEvent.press(screen.getByRole("button", { name: "Expand Wright Brothers" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "View Core values guide" }));
  expect(screen.queryByRole("button", { name: "Save replacement" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Choose replacement PNG" }));
  await waitFor(() => expect(screen.getByText("corrected.png · 1400 × 1000")).toBeVisible());
  expect(screen.getByRole("button", { name: "Save replacement" })).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText("Reason for replacement (at least 10 characters)"),
    "Corrected the diagram labels",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save replacement" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      visual,
      file,
      altText: "Core values guide",
      reason: "Corrected the diagram labels",
    }),
  );
  await waitFor(() => expect(screen.getByText(/Replacement saved/)).toBeVisible());
});
it("shows picker failures without activating a replacement", async () => {
  jest.mocked(pickLearningVisual).mockRejectedValue(new Error("Choose a PNG no larger than 5 MB."));
  await render(<VisualLibraryAdmin />);
  await fireEvent.press(screen.getByRole("button", { name: "Expand Wright Brothers" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "View Core values guide" }));
  await fireEvent.press(screen.getByRole("button", { name: "Choose replacement PNG" }));
  await waitFor(() => expect(screen.getByText("Choose a PNG no larger than 5 MB.")).toBeVisible());
  expect(save).not.toHaveBeenCalled();
});

it("loads only expanded chapters and removes previews when collapsed", async () => {
  const second = {
    ...visual,
    asset_key: "c2_guide",
    storage_path: "assets/cap-visuals/chapter2.png",
    alt_text: "Chapter two guide",
    locations: [
      { ...visual.locations[0], chapter_number: 2, chapter_title: "Learn to Lead chapter two" },
    ],
  };
  jest.mocked(hooks.useAdminVisuals).mockReturnValue({
    data: [visual, second],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  await render(<VisualLibraryAdmin />);
  await fireEvent.press(screen.getByRole("button", { name: "Expand Wright Brothers" }));
  expect(hooks.useAdminVisualUrl).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }),
  );
  expect(screen.getByRole("button", { name: "View Core values guide" })).toBeVisible();
  expect(hooks.useAdminVisualUrl).toHaveBeenCalledWith(visual.storage_path);
  expect(hooks.useAdminVisualUrl).not.toHaveBeenCalledWith(second.storage_path);
  await fireEvent.press(
    screen.getByRole("button", { name: "Collapse Chapter 1 · Learn to Lead chapter one" }),
  );
  expect(screen.queryByRole("button", { name: "View Core values guide" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }).props
      .accessibilityState,
  ).toEqual({ expanded: false });
});

it("does not load chapter previews automatically when searching", async () => {
  await render(<VisualLibraryAdmin />);
  await fireEvent.changeText(
    screen.getByLabelText("Search images, tests, or chapters"),
    "Core values",
  );
  expect(
    screen.getByRole("button", { name: "Expand Chapter 1 · Learn to Lead chapter one" }),
  ).toBeVisible();
  expect(hooks.useAdminVisualUrl).not.toHaveBeenCalled();
});
