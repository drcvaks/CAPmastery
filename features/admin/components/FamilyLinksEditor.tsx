import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
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
    <View style={{ gap: 16 }}>
      <AppButton
        label="Back to all users"
        onPress={onBack}
        disabled={save.isPending}
        variant="secondary"
      />
      <AppCard title="Family links" description={`Parent account: ${identify(parent.user_id)}`}>
        <Text>
          New links grant read-only access to Family Progress for the selected cadet. They do not
          grant answer keys, content assignment, or challenge management.
        </Text>
        {links.isPending ? <Text>Loading family links…</Text> : null}
        {links.isError ? (
          <>
            <Text accessibilityRole="alert">Could not load family links.</Text>
            <AppButton
              label="Retry family links"
              onPress={() => void links.refetch()}
              variant="secondary"
            />
          </>
        ) : null}
        {links.data?.length === 0 ? <Text>No active family links.</Text> : null}
        {links.data?.map((link) => (
          <View key={link.student_id} style={{ gap: 6 }}>
            <Text>
              {identify(link.student_id)} · {link.relationship_type}
            </Text>
            <Text>{link.can_view_progress ? "Can view progress" : "Progress sharing off"}</Text>
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
            {term && !matches.length ? <Text>No eligible cadets match.</Text> : null}
            {matches.length > 10 ? (
              <Text>Showing 10 matches. Refine your search to see others.</Text>
            ) : null}
          </>
        ) : null}
        {pending ? (
          <View style={{ gap: 8 }}>
            <Text>
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
        {save.isSuccess ? <Text accessibilityRole="alert">Family links updated.</Text> : null}
        {save.isError ? (
          <Text accessibilityRole="alert">
            Could not confirm the update. Check the accounts and try again.
          </Text>
        ) : null}
      </AppCard>
    </View>
  );
}
