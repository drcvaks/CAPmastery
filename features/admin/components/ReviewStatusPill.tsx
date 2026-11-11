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
    <Text style={[styles.pill, status === "approved" && styles.approved]}>
      {status === "draft" && saved ? "Corrections saved · draft" : labels[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "700",
  },
  approved: { backgroundColor: theme.colors.success, color: theme.colors.surface },
});
