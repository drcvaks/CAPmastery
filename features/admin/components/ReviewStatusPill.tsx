import { StyleSheet, Text } from "react-native";
import { theme } from "../../../lib/constants/theme";
import type { ReviewQueueItem } from "../schemas";

const labels = {
  draft: "Draft · needs review",
  in_review: "In review",
  approved: "Reviewed · approved",
  rejected: "Reviewed · rejected",
  archived: "Archived",
};

export function ReviewStatusPill({
  status,
  saved,
}: {
  status: ReviewQueueItem["review_status"];
  saved?: boolean;
}) {
  return (
    <Text
      style={[
        styles.pill,
        status === "draft" && (saved ? styles.savedDraft : styles.draft),
        status === "in_review" && styles.inReview,
        status === "approved" && styles.approved,
        status === "rejected" && styles.rejected,
        status === "archived" && styles.archived,
      ]}
    >
      {status === "draft" && saved ? "Corrections saved · draft" : labels[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  archived: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    color: theme.colors.muted,
  },
  approved: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    color: theme.colors.success,
  },
  draft: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warningBorder,
    color: theme.colors.warning,
  },
  inReview: {
    backgroundColor: theme.colors.infoSoft,
    borderColor: theme.colors.borderStrong,
    color: theme.colors.primary,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rejected: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    color: theme.colors.danger,
  },
  savedDraft: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    color: theme.colors.primaryDark,
  },
});
