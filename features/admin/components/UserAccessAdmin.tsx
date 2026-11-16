import { useState } from "react";
import { LearningAccessEditor } from "./LearningAccessEditor";
import { FamilyLinksEditor } from "./FamilyLinksEditor";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../../../components/common/AppCard";
import { AppButton } from "../../../components/common/AppButton";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { useAdminUserAccessOverview } from "../hooks/useAdminUserAccess";
import { packetGroupIdentity } from "../packetGrouping";
import type { AdminAccessPacket, AdminAccessUser } from "../schemas";

export function UserAccessAdmin() {
  const overview = useAdminUserAccessOverview();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [familyId, setFamilyId] = useState<string>();
  const selectedUser = overview.data?.users.find((user) => user.user_id === selectedId);
  const familyUser = overview.data?.users.find((user) => user.user_id === familyId);

  if (familyUser && overview.data) {
    return (
      <FamilyLinksEditor
        key={familyUser.user_id}
        parent={familyUser}
        users={overview.data.users}
        onBack={() => setFamilyId(undefined)}
      />
    );
  }

  if (selectedUser && overview.data) {
    return (
      <LearningAccessEditor
        key={selectedUser.user_id}
        onBack={() => setSelectedId(undefined)}
        packets={overview.data.packages}
        user={selectedUser}
      />
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const users =
    overview.data?.users.filter((user) =>
      `${user.display_name} ${user.email ?? ""} ${user.roles.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery),
    ) ?? [];
  const studentCount = overview.data?.users.filter((user) => user.roles.includes("student")).length;

  return (
    <View style={styles.stack}>
      <AppCard
        description="Search registered accounts, then open one user to manage Study and Content Review access."
        title="Registered users"
      >
        <AppTextField
          autoCapitalize="none"
          autoCorrect={false}
          label="Search by name, email, or role"
          onChangeText={setQuery}
          placeholder="Start typing to filter users"
          value={query}
        />
        {overview.data ? (
          <View style={styles.summaryBanner}>
            <Text style={styles.summary}>
              {overview.data.users.length} registered · {studentCount} students ·{" "}
              {overview.data.packages.length} study packets
            </Text>
          </View>
        ) : null}
        {overview.isPending ? <Text style={styles.muted}>Loading registered users…</Text> : null}
        {overview.isError ? <ErrorText value={overview.error} /> : null}
        {overview.data && users.length === 0 ? (
          <Text style={styles.muted}>No registered users match that search.</Text>
        ) : null}
      </AppCard>

      {users.map((user) => (
        <View key={user.user_id} style={styles.userCard}>
          <Pressable
            accessibilityHint="Opens Study and Content Review permissions"
            accessibilityLabel={`Manage access for ${user.display_name}`}
            accessibilityRole="button"
            onPress={() => setSelectedId(user.user_id)}
            style={({ pressed }) => [styles.cardContents, pressed && styles.pressed]}
          >
            <View style={styles.userHeading}>
              <View style={styles.userIdentity}>
                <Text style={styles.userName}>{user.display_name}</Text>
                <Text style={styles.email}>{user.email ?? "No email address"}</Text>
              </View>
              <Text style={[styles.status, user.status === "disabled" && styles.statusDisabled]}>
                {user.status}
              </Text>
            </View>
            <View style={styles.chips}>
              {user.roles.length ? (
                user.roles.map((role) => (
                  <Text
                    key={role}
                    style={[
                      styles.chip,
                      role === "student" && styles.studentChip,
                      role === "admin" && styles.adminChip,
                    ]}
                  >
                    {role}
                  </Text>
                ))
              ) : (
                <Text style={styles.noRole}>No workspace role</Text>
              )}
            </View>
            <View style={styles.packetBox}>
              <AssignedPacketSummary packets={overview.data?.packages ?? []} user={user} />
            </View>
            <Text style={styles.manageLabel}>Manage access →</Text>
          </Pressable>
          <View style={styles.cardFooter}>
            <AppButton
              label={`Family links for ${user.display_name}`}
              variant="secondary"
              onPress={() => setFamilyId(user.user_id)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

type PacketGroup = { key: string; title: string; order: number; packets: AdminAccessPacket[] };

function AssignedPacketSummary({
  packets,
  user,
}: {
  packets: AdminAccessPacket[];
  user: AdminAccessUser;
}) {
  if (user.assigned_packages.length === 0) {
    return <Text style={styles.packetSummary}>No study packets assigned</Text>;
  }

  const assigned = new Set(user.assigned_packages);
  const groups = groupPackets(packets.filter((packet) => assigned.has(packet.import_package)));
  const resolved = new Set(groups.flatMap((group) => group.packets.map((p) => p.import_package)));
  const unresolvedCount = user.assigned_packages.filter((code) => !resolved.has(code)).length;

  return (
    <View style={styles.assignedSummary}>
      <Text style={styles.packetSummary}>
        {user.assigned_packages.length} assigned{" "}
        {user.assigned_packages.length === 1 ? "packet" : "packets"}
      </Text>
      {groups.map((group) => (
        <Text key={group.key} numberOfLines={1} style={styles.assignedGroup}>
          {group.title} · {summarizeSections(group.packets)}
        </Text>
      ))}
      {unresolvedCount ? (
        <Text style={styles.assignedGroup}>
          {unresolvedCount} additional {unresolvedCount === 1 ? "packet" : "packets"}
        </Text>
      ) : null}
    </View>
  );
}

function groupPackets(packets: AdminAccessPacket[]): PacketGroup[] {
  const groups = new Map<string, PacketGroup>();
  for (const packet of packets) {
    const identity = packetGroupIdentity(packet.exam_title);
    const group = groups.get(identity.key) ?? { ...identity, packets: [] };
    group.packets.push(packet);
    groups.set(identity.key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      packets: [...group.packets].sort((a, b) =>
        a.import_package.localeCompare(b.import_package, undefined, { numeric: true }),
      ),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function summarizeSections(packets: AdminAccessPacket[]) {
  const labels = packets.map((packet) => packetSection(packet));
  const kinds = new Set(labels.map((label) => label.kind));
  if (kinds.size === 1 && labels.every((label) => label.number !== null)) {
    const kind = labels[0]?.kind ?? "Section";
    const numbers = [...new Set(labels.map((label) => label.number as number))].sort(
      (a, b) => a - b,
    );
    return `${kind}${numbers.length === 1 ? "" : "s"} ${compactRanges(numbers)}`;
  }
  return labels.map((label) => label.fallback).join(", ");
}

function packetSection(packet: AdminAccessPacket) {
  const chapter = packet.import_package.match(/^LTL\d+_C(\d+)_/);
  if (chapter) {
    return { kind: "Chapter", number: Number(chapter[1]), fallback: `Chapter ${chapter[1]}` };
  }
  const module = packet.import_package.match(/^AD_M(\d+)_/);
  if (module) {
    return { kind: "Module", number: Number(module[1]), fallback: `Module ${module[1]}` };
  }
  return {
    kind: "Section",
    number: null,
    fallback: packet.topic_titles[0] ?? packet.exam_title,
  };
}

function compactRanges(numbers: number[]) {
  const ranges: string[] = [];
  let start = numbers[0];
  let end = numbers[0];
  for (const value of numbers.slice(1)) {
    if (end !== undefined && value === end + 1) {
      end = value;
      continue;
    }
    if (start !== undefined && end !== undefined)
      ranges.push(start === end ? `${start}` : `${start}–${end}`);
    start = value;
    end = value;
  }
  if (start !== undefined && end !== undefined)
    ranges.push(start === end ? `${start}` : `${start}–${end}`);
  return ranges.join(", ");
}

function ErrorText({ value }: { value: unknown }) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "object" && value && "message" in value
        ? String(value.message)
        : "The request could not be completed.";
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  adminChip: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    color: theme.colors.primaryDark,
  },
  assignedGroup: { color: theme.colors.inkSecondary, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  assignedSummary: { gap: 3 },
  cardContents: { gap: theme.spacing.sm },
  cardFooter: {
    alignItems: "flex-start",
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
  email: { color: theme.colors.muted, fontSize: 14, fontWeight: "500" },
  error: { color: theme.colors.danger, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  manageLabel: { color: theme.colors.accent, fontSize: 14, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  noRole: { color: theme.colors.danger, fontSize: 13, fontWeight: "700" },
  packetBox: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.sm,
  },
  packetSummary: { color: theme.colors.primary, fontSize: 14, fontWeight: "800", lineHeight: 20 },
  pressed: { opacity: 0.85 },
  stack: { gap: theme.spacing.md },
  status: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  statusDisabled: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    color: theme.colors.danger,
  },
  studentChip: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    color: theme.colors.success,
  },
  summary: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  summaryBanner: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  userHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  userIdentity: { flex: 1, gap: 3 },
  userName: { color: theme.colors.ink, fontSize: 19, fontWeight: "900" },
});
