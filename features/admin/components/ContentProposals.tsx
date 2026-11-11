import { useState } from "react";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppCard } from "../../../components/common/AppCard";
import { AppButton } from "../../../components/common/AppButton";
import { AppTextField } from "../../../components/common/AppTextField";
import {
  decideContentProposal,
  fetchContentProposals,
  type ContentProposal,
  type ProposalDecision,
} from "../../../services/contentTesterService";
import { useOptionalAuth } from "../../auth/AuthContext";
import { useAdminVisualUrl, useAdminVisuals } from "../hooks/useAdminVisuals";
import { useReviewQueue } from "../hooks/useContentAdmin";
import { reviewQuestionSchema } from "../schemas";

function errorText(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "The proposal request failed.";
}
const stack = { gap: 12 };
const statusLabels = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
  uploading: "Upload incomplete",
};
export function ContentProposals({ admin }: { admin: boolean }) {
  const userId = useOptionalAuth()?.session?.user.id;
  const [selected, setSelected] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  const proposals = useQuery({
    queryKey: ["content-proposals", userId, admin],
    queryFn: fetchContentProposals,
    gcTime: 0,
  });
  const proposal = proposals.data?.find((item) => item.id === selected);
  if (proposals.isError)
    return (
      <AppCard title="Proposals unavailable">
        <Text accessibilityRole="alert">{errorText(proposals.error)}</Text>
        <AppButton label="Retry proposals" onPress={() => void proposals.refetch()} />
      </AppCard>
    );
  if (proposal && admin)
    return (
      <ProposalDetail key={proposal.id} proposal={proposal} onBack={() => setSelected(undefined)} />
    );
  const list = proposals.data?.filter((item) => !admin || showHistory || item.status === "pending");
  return (
    <View style={stack}>
      <AppCard
        title={admin ? "Pending approvals" : "My proposals"}
        description={
          admin
            ? "Compare the original and proposed changes before applying them."
            : "Your proposals do not change live content until approved."
        }
      >
        {admin ? (
          <AppButton
            label={showHistory ? "Show pending only" : "Include proposal history"}
            variant="secondary"
            onPress={() => setShowHistory(!showHistory)}
          />
        ) : null}
        <AppButton
          label="Refresh proposals"
          variant="secondary"
          onPress={() => void proposals.refetch()}
        />
        {proposals.isPending ? (
          <Text>Loading proposals…</Text>
        ) : list?.length ? null : (
          <Text>No proposals to show.</Text>
        )}
      </AppCard>
      {list?.map((item) => (
        <AppCard
          key={item.id}
          title={summary(item)}
          description={`${statusLabels[item.status]} · ${item.author_name}`}
        >
          <Text>{item.reason}</Text>
          {item.decision_notes ? <Text>Admin feedback: {item.decision_notes}</Text> : null}
          {admin ? (
            <AppButton label="Compare proposal" onPress={() => setSelected(item.id)} />
          ) : null}
        </AppCard>
      ))}
    </View>
  );
}
function summary(item: ContentProposal) {
  const key = item.kind === "question" ? "question_text" : "alt_text";
  const value = item.proposed_content[key];
  return typeof value === "string"
    ? value
    : item.kind === "image"
      ? "Image replacement"
      : "Question correction";
}
function ProposalDetail({ proposal, onBack }: { proposal: ContentProposal; onBack: () => void }) {
  const client = useQueryClient();
  const { width } = useWindowDimensions();
  const [notes, setNotes] = useState("");
  const [ratings, setRatings] = useState({ accuracy: "", clarity: "", source: "" });
  const [confirm, setConfirm] = useState<ProposalDecision>();
  const [replacementLoaded, setReplacementLoaded] = useState(false);
  const library = useAdminVisuals(false, proposal.kind === "image");
  const imageReady =
    proposal.kind !== "image" ||
    (!library.isError &&
      replacementLoaded &&
      library.data?.some((item) => item.asset_key === proposal.target));
  const prior = reviewQuestionSchema.safeParse(proposal.before_content);
  const liveQuestion =
    proposal.kind === "question" &&
    prior.success &&
    prior.data.question.review_status === "approved";
  const mutation = useMutation({
    mutationFn: (decision: ProposalDecision) =>
      decideContentProposal({ id: proposal.id, decision, notes, ratings }),
    onSuccess: async () => {
      await Promise.all(
        ["content-proposals", "admin-visuals", "content-admin", "study"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      setConfirm(undefined);
    },
  });
  return (
    <View style={stack}>
      <AppButton
        label="Back to proposals"
        variant="secondary"
        disabled={mutation.isPending}
        onPress={onBack}
      />
      <AppCard
        title={summary(proposal)}
        description={`${statusLabels[proposal.status]} · ${proposal.author_name}`}
      >
        <Text>Tester notes: {proposal.reason}</Text>
        {proposal.kind === "image" ? (
          <ImageImpact assetKey={proposal.target} library={library} />
        ) : (
          <QuestionLocation id={proposal.target} />
        )}
      </AppCard>
      <View style={{ gap: 12, flexDirection: width >= 1050 ? "row" : "column" }}>
        {(["Original", "Proposed"] as const).map((side) => (
          <View key={side} style={{ flex: 1, minWidth: 0 }}>
            <AppCard title={side}>
              {proposal.kind === "question" ? (
                <QuestionFields
                  values={
                    side === "Original" ? originalFields(proposal) : proposal.proposed_content
                  }
                />
              ) : (
                <ImageSide
                  onLoad={side === "Proposed" ? () => setReplacementLoaded(true) : undefined}
                  onError={side === "Proposed" ? () => setReplacementLoaded(false) : undefined}
                  path={
                    side === "Original"
                      ? String(proposal.before_content.storage_path)
                      : proposal.upload_path
                  }
                  alt={String(
                    (side === "Original" ? proposal.before_content : proposal.proposed_content)
                      .alt_text,
                  )}
                />
              )}
            </AppCard>
          </View>
        ))}
      </View>
      {proposal.status === "pending" ? (
        <AppCard
          title="Admin decision"
          description={
            liveQuestion
              ? "Approval applies the corrections and republishes this approved question."
              : "Approval applies the proposed changes without changing the original publication status for an image or publishing a draft question."
          }
        >
          <AppTextField
            label="Decision notes for tester"
            value={notes}
            onChangeText={setNotes}
            maxLength={2000}
            multiline
            editable={!mutation.isPending}
          />
          {liveQuestion
            ? (Object.keys(ratings) as (keyof typeof ratings)[]).map((key) => (
                <AppTextField
                  key={key}
                  label={`${key} rating (1–5)`}
                  value={ratings[key]}
                  onChangeText={(value) => setRatings((current) => ({ ...current, [key]: value }))}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!mutation.isPending}
                />
              ))
            : null}
          {(["approved", "changes_requested", "rejected"] as const).map((decision) => (
            <AppButton
              key={decision}
              label={
                decision === "approved"
                  ? "Approve and apply"
                  : decision === "changes_requested"
                    ? "Request changes"
                    : "Reject proposal"
              }
              variant={decision === "approved" ? "primary" : "secondary"}
              disabled={
                mutation.isPending ||
                (decision === "approved" && !imageReady) ||
                (decision === "approved" &&
                  liveQuestion &&
                  !Object.values(ratings).every((rating) => /^[1-5]$/.test(rating)))
              }
              onPress={() => {
                mutation.reset();
                setConfirm(decision);
              }}
            />
          ))}
          {confirm ? (
            <View style={stack}>
              <Text>Confirm decision: {statusLabels[confirm]}.</Text>
              <AppButton
                label="Confirm decision"
                disabled={
                  (confirm === "approved" && !imageReady) ||
                  (confirm === "changes_requested" && !notes.trim())
                }
                loading={mutation.isPending}
                onPress={() => mutation.mutate(confirm)}
              />
              <AppButton
                label="Cancel decision"
                variant="secondary"
                disabled={mutation.isPending}
                onPress={() => setConfirm(undefined)}
              />
            </View>
          ) : null}
          {mutation.isError ? (
            <Text accessibilityRole="alert">{errorText(mutation.error)}</Text>
          ) : null}
        </AppCard>
      ) : proposal.decision_notes ? (
        <Text>Admin feedback: {proposal.decision_notes}</Text>
      ) : null}
    </View>
  );
}
function originalFields(proposal: ContentProposal) {
  const original = reviewQuestionSchema.safeParse(proposal.before_content);
  if (!original.success) return {};
  const { question, choices, answer } = original.data;
  return {
    ...question,
    ...answer,
    choices,
    correct_letter: choices.find((choice) => choice.id === answer.correct_choice_id)?.key,
  };
}
function QuestionFields({ values }: { values: Record<string, unknown> }) {
  const fields = [
    "question_text",
    "choices",
    "correct_letter",
    "explanation",
    "source_reference",
    "common_mistake",
    "remediation",
    "difficulty",
    "cognitive_level",
    "source_page_start",
    "source_page_end",
    "estimated_time_seconds",
    "chapter_number",
    "exam_likeness",
    "distractor_difficulty",
    "eligible_for_final_exam",
    "final_exam_weight",
    "content_origin",
    "style_reference",
  ];
  return (
    <>
      {fields.map((key) => (
        <View key={key} style={{ gap: 3 }}>
          <Text style={{ fontWeight: "700" }}>{key.replaceAll("_", " ")}</Text>
          {key === "choices" && Array.isArray(values.choices) ? (
            values.choices.map((choice, i) => (
              <Text key={i}>
                {String(choice.key)}. {String(choice.text)}
                {choice.feedback ? ` — ${String(choice.feedback)}` : ""}
              </Text>
            ))
          ) : (
            <Text>{String(values[key] ?? "—") || "—"}</Text>
          )}
        </View>
      ))}
    </>
  );
}
function QuestionLocation({ id }: { id: string }) {
  const queue = useReviewQueue();
  const item = queue.data?.find((q) => q.question_id === id);
  return item ? (
    <Text>
      {item.exam_title} · {item.module_number ? `Module ${item.module_number} · ` : ""}
      {item.chapter_title ?? item.topic_title}
    </Text>
  ) : null;
}
function ImageImpact({
  assetKey,
  library,
}: {
  assetKey: string;
  library: ReturnType<typeof useAdminVisuals>;
}) {
  const image = library.data?.find((item) => item.asset_key === assetKey);
  return (
    <View style={stack}>
      <Text>Approval replaces this image everywhere it is used.</Text>
      {image?.locations.map((loc, i) => (
        <Text key={i}>
          {loc.exam_title} · {loc.module_number ? `Module ${loc.module_number} · ` : ""}
          {loc.chapter_title} · {loc.question_count} questions
        </Text>
      ))}
      {library.isError ? (
        <Text accessibilityRole="alert">
          Could not load image locations. Check Image Library before approving.
        </Text>
      ) : library.isPending ? (
        <Text>Loading affected chapters…</Text>
      ) : !image?.locations.length ? (
        <Text>No current question links.</Text>
      ) : null}
    </View>
  );
}
function ImageSide({
  path,
  alt,
  onLoad,
  onError,
}: {
  path: string | null;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  return (
    <>
      {path ? (
        <ProposalImage path={path} alt={alt} onLoad={onLoad} onError={onError} />
      ) : (
        <Text>No image uploaded.</Text>
      )}
      <Text>{alt}</Text>
    </>
  );
}
function ProposalImage({
  path,
  alt,
  onLoad,
  onError,
}: {
  path: string;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const url = useAdminVisualUrl(path);
  const [failed, setFailed] = useState(false);
  return url.data ? (
    <>
      <Image
        accessibilityLabel={alt}
        source={{ uri: url.data }}
        resizeMode="contain"
        onLoad={() => {
          setFailed(false);
          onLoad?.();
        }}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
        style={{ width: "100%", height: 300 }}
      />
      {failed ? <Text accessibilityRole="alert">The image could not be decoded.</Text> : null}
    </>
  ) : (
    <Text>{url.isError ? "Image preview unavailable." : "Loading image preview…"}</Text>
  );
}
