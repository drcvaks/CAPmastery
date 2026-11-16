import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { adminFamilyLinks } from "../../../services/adminAccessService";
import { adminUserAccessKeys } from "../hooks/useAdminUserAccess";
import type { AdminAccessUser } from "../schemas";

export function FamilyLinksEditor({
  parent,
  users,
  onBack,
}: {
  parent: AdminAccessUser;
  users: AdminAccessUser[];
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ studentId: string; enabled: boolean }>();
  const client = useQueryClient();
  const key = ["admin-family-links", parent.user_id];
  const links = useQuery({
    queryKey: key,
    queryFn: () => adminFamilyLinks(parent.user_id),
    gcTime: 0,
  });
  const save = useMutation({
    mutationFn: (change: NonNullable<typeof pending>) => adminFamilyLinks(parent.user_id, change),
    onSuccess: (result) => {
      client.setQueryData(key, result);
      setPending(undefined);
      setSearch("");
      void client.invalidateQueries({ queryKey: adminUserAccessKeys.overview });
    },
  });
  const term = search.trim().toLowerCase();
  const matches =
    term && links.data
      ? users.filter(
          (user) =>
            user.user_id !== parent.user_id &&
            user.status === "active" &&
            user.roles.includes("student") &&
            !links.data?.some((link) => link.student_id === user.user_id) &&
            `${user.display_name} ${user.email ?? ""}`.toLowerCase().includes(term),
        )
      : [];
  const identify = (id: string) => {
    const user = users.find((entry) => entry.user_id === id);
    return user
      ? `${user.display_name} · ${user.email ?? "No email address"}`
      : "Unavailable cadet";
  };
  const choose = (studentId: string, enabled: boolean) => {
    save.reset();
    setPending({ studentId, enabled });
  };

  return (
    <View style={styles.stack}>
      <View style={styles.backRow}>
        <AppButton
          label="Back to all users"
          onPress={onBack}
          disabled={save.isPending}
          variant="secondary"
        />
      </View>
      <AppCard title="Family links" description={`Parent account: ${identify(parent.user_id)}`}>
        <Text style={styles.body}>
          New links grant read-only access to Family Progress for the selected cadet. They do not
          grant answer keys, content assignment, or challenge management.
        </Text>
        {links.isPending ? <Text style={styles.muted}>Loading family links…</Text> : null}
        {links.isError ? (
          <>
            <Text accessibilityRole="alert" style={styles.errorAlert}>
              Could not load family links.
            </Text>
            <AppButton
              label="Retry family links"
              onPress={() => void links.refetch()}
              variant="secondary"
            />
          </>
        ) : null}
        {links.data?.length === 0 ? <Text style={styles.muted}>No active family links.</Text> : null}
        {links.data?.map((link) => (
          <View key={link.student_id} style={styles.linkCard}>
            <Text style={styles.linkTitle}>
              {identify(link.student_id)} · {link.relationship_type}
            </Text>
            <Text style={styles.linkBadge}>
              {link.can_view_progress ? "Can view progress" : "Progress sharing off"}
            </Text>
            <AppButton
              label={`Revoke link: ${identify(link.student_id)}`}
              disabled={save.isPending}
              onPress={() => choose(link.student_id, false)}
              variant="secondary"
            />
          </View>
        ))}
        {links.data && parent.status === "active" ? (
          <>
            <AppTextField
              label="Find a cadet by name or email"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              editable={!save.isPending}
            />
            {matches.slice(0, 10).map((student) => (
              <AppButton
                key={student.user_id}
                label={`Link cadet: ${identify(student.user_id)}`}
                disabled={save.isPending}
                onPress={() => choose(student.user_id, true)}
                variant="secondary"
              />
            ))}
            {term && !matches.length ? (
              <Text style={styles.muted}>No eligible cadets match.</Text>
            ) : null}
            {matches.length > 10 ? (
              <Text style={styles.muted}>Showing 10 matches. Refine your search to see others.</Text>
            ) : null}
          </>
        ) : null}
        {pending ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              {pending.enabled ? "Share progress for" : "Revoke this family link for"}{" "}
              {identify(pending.studentId)}?
            </Text>
            <AppButton
              label={pending.enabled ? "Confirm family link" : "Confirm revocation"}
              loading={save.isPending}
              onPress={() => save.mutate(pending)}
            />
            <AppButton
              label="Cancel"
              variant="secondary"
              disabled={save.isPending}
              onPress={() => {
                setPending(undefined);
                save.reset();
              }}
            />
          </View>
        ) : null}
        {save.isSuccess ? (
          <Text accessibilityRole="alert" style={styles.successAlert}>
            Family links updated.
          </Text>
        ) : null}
        {save.isError ? (
          <Text accessibilityRole="alert" style={styles.errorAlert}>
            Could not confirm the update. Check the accounts and try again.
          </Text>
        ) : null}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: { alignItems: "flex-start" },
  body: { color: theme.colors.inkSecondary, fontSize: 14, lineHeight: 21 },
  confirmBox: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  confirmTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 22 },
  errorAlert: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "700",
    padding: theme.spacing.sm,
  },
  linkBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  linkTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  stack: { gap: theme.spacing.md },
  successAlert: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: "800",
    padding: theme.spacing.sm,
  },
});
