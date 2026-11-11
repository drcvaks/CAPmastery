import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ContentProposals } from "../features/admin/components/ContentProposals";
import { LearningAccessEditor } from "../features/admin/components/LearningAccessEditor";
import {
  decideContentProposal,
  fetchContentProposals,
  learningAccess,
  type ContentProposal,
} from "../services/contentTesterService";

jest.mock("../services/contentTesterService", () => ({
  decideContentProposal: jest.fn(),
  fetchContentProposals: jest.fn(),
  learningAccess: jest.fn(),
}));
jest.mock("../features/admin/hooks/useAdminVisuals", () => ({
  useAdminVisuals: () => ({}),
  useAdminVisualUrl: () => ({}),
}));
jest.mock("../features/admin/hooks/useAdminUserAccess", () => ({
  adminUserAccessKeys: { overview: ["admin-user-access", "overview"] },
}));
jest.mock("../features/admin/hooks/useContentAdmin", () => ({
  useReviewQueue: () => ({ data: [] }),
}));

const userId = "ad600000-0000-4000-8000-000000000002";
const examId = "20000000-0000-4000-8000-000000000001";
const chapterId = "ad600000-0000-4000-8000-000000000011";
const pending: ContentProposal = {
  id: "ad600000-0000-4000-8000-000000000061",
  kind: "question",
  target: "ad600000-0000-4000-8000-000000000021",
  author_name: "Synthetic tester",
  reason: "Clarify original wording",
  status: "pending",
  decision_notes: null,
  upload_path: null,
  before_content: {},
  proposed_content: { question_text: "Corrected question wording" },
};
function wrap(component: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{component}</QueryClientProvider>;
}
beforeEach(() => jest.clearAllMocks());

it("saves a module study packet and review scopes independently in one request", async () => {
  const packet = {
    import_package: "AD_M1_100",
    exam_title: "Billy Mitchell Aerospace",
    topic_titles: ["Module 1"],
    question_count: 100,
  };
  const module = {
    exam_id: examId,
    exam_title: packet.exam_title,
    chapter_number: null,
    module_number: 1,
    question_count: 100,
    image_count: 3,
    packages: [packet.import_package],
  };
  const data = {
    grants: [],
    sections: [
      { ...module, chapter_id: null, title: "Introduction to Flight" },
      { ...module, chapter_id: chapterId, title: "Chapter 1", chapter_number: 1 },
      { ...module, chapter_id: "second", title: "Chapter 2", chapter_number: 2 },
    ],
  };
  jest.mocked(learningAccess).mockResolvedValue(data);
  await render(
    wrap(
      <LearningAccessEditor
        onBack={() => undefined}
        packets={[packet]}
        user={{
          user_id: userId,
          display_name: "Tester",
          email: null,
          status: "active",
          created_at: "",
          roles: ["student"],
          assigned_packages: [],
        }}
      />,
    ),
  );
  await fireEvent.press(await screen.findByLabelText(packet.exam_title));
  await fireEvent.press(screen.getByLabelText("Module 1"));
  await fireEvent(screen.getByLabelText("Module 1: Study packet (AD_M1_100)"), "valueChange", true);
  await fireEvent(screen.getByLabelText("Module 1: Review images"), "valueChange", true);
  await fireEvent.press(screen.getByLabelText("Chapter 1"));
  await fireEvent(
    screen.getByLabelText("Module 1 · Chapter 1: Review questions & answers"),
    "valueChange",
    true,
  );
  await fireEvent.press(screen.getByText("Save access"));
  await waitFor(() =>
    expect(learningAccess).toHaveBeenCalledWith(userId, {
      studentEnabled: true,
      packages: [packet.import_package],
      grants: [
        { kind: "image", exam_id: examId, chapter_id: chapterId },
        { kind: "image", exam_id: examId, chapter_id: "second" },
        { kind: "question", exam_id: examId, chapter_id: chapterId },
      ],
    }),
  );
});

it("requires explicit admin confirmation before applying a proposal", async () => {
  jest.mocked(fetchContentProposals).mockResolvedValue([pending]);
  jest.mocked(decideContentProposal).mockResolvedValue(undefined);
  await render(wrap(<ContentProposals admin />));
  await fireEvent.press(await screen.findByText("Compare proposal"));
  await fireEvent.press(screen.getByText("Approve and apply"));
  expect(decideContentProposal).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Confirm decision"));
  await waitFor(() =>
    expect(decideContentProposal).toHaveBeenCalledWith(
      expect.objectContaining({ id: pending.id, decision: "approved" }),
    ),
  );
});

it("shows tester proposal history without admin comparison or approval buttons", async () => {
  const revision: ContentProposal = {
    ...pending,
    status: "changes_requested",
    decision_notes: "Please confirm the source page.",
  };
  jest.mocked(fetchContentProposals).mockResolvedValue([revision]);
  await render(wrap(<ContentProposals admin={false} />));
  expect(await screen.findByText("Admin feedback: Please confirm the source page.")).toBeVisible();
  expect(screen.queryByText("Compare proposal")).toBeNull();
  expect(screen.queryByText("Approve and apply")).toBeNull();
});
