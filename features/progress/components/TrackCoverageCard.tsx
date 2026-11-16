import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import type { MissionTrack } from "../../../services/missionService";

export function TrackCoverageCard({ track }: { track: MissionTrack }) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const modules = [...new Set(track.sections.map((section) => section.module_number))];
  const isModular = modules.some((number) => number !== null);
  const completedChapters = track.sections.filter(
    (section) => section.practiced_count >= section.available_count,
  ).length;
  const completedModules = modules.filter((number) =>
    track.sections
      .filter((section) => section.module_number === number)
      .every((section) => section.practiced_count >= section.available_count),
  ).length;

  return (
    <AppCard
      title={`Your route: ${track.title}`}
      description="Question coverage, not mastery. Based on your available study questions; revisit chapters whenever you like."
    >
      <View style={styles.overviewBox}>
        <Text style={styles.summary}>
          {isModular
            ? `${completedModules} of ${modules.length} modules fully practiced`
            : `${completedChapters} of ${track.sections.length} chapters fully practiced`}
        </Text>
        <CoverageBar
          count={track.practiced_count}
          total={track.available_count}
          label={`${track.title} question coverage`}
        />
        <Text style={styles.muted}>
          {track.practiced_count} / {track.available_count} questions practiced
        </Text>
      </View>

      <View style={styles.sectionList}>
        {isModular
          ? modules.map((number) => {
              const sections = track.sections.filter(
                (section) => section.module_number === number,
              );
              const done = sections.filter(
                (section) => section.practiced_count >= section.available_count,
              ).length;
              const title =
                sections[0]?.module_title ??
                (number === null ? "Other chapters" : `Module ${number}`);
              const open = expanded.has(number ?? 0);
              return (
                <View key={number ?? 0} style={styles.module}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={title}
                    accessibilityState={{ expanded: open }}
                    style={[styles.moduleHeading, open && styles.moduleHeadingOpen]}
                    onPress={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (open) next.delete(number ?? 0);
                        else next.add(number ?? 0);
                        return next;
                      })
                    }
                  >
                    <View style={styles.moduleCopy}>
                      <Text style={styles.title}>{title}</Text>
                      <Text style={styles.muted}>
                        {done} / {sections.length} chapters fully practiced
                      </Text>
                    </View>
                    <View style={styles.toggleBadge}>
                      <Text style={styles.toggleText}>{open ? "−" : "+"}</Text>
                    </View>
                  </Pressable>
                  {open ? (
                    <View style={styles.moduleChapters}>
                      {sections.map((section) => (
                        <ChapterCoverage key={section.topic_id} section={section} />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })
          : track.sections.map((section) => (
              <ChapterCoverage key={section.topic_id} section={section} />
            ))}
      </View>
    </AppCard>
  );
}

function ChapterCoverage({ section }: { section: MissionTrack["sections"][number] }) {
  const chapterLabel =
    section.chapter_number && !/^chapter\s+\d+/i.test(section.chapter_title)
      ? `Chapter ${section.chapter_number}: ${section.chapter_title}`
      : section.chapter_title;
  const isComplete = section.practiced_count >= section.available_count;
  const isInProgress = !isComplete && section.practiced_count > 0;
  const status = isComplete
    ? "All questions practiced"
    : isInProgress
      ? "In progress"
      : "Not started";

  return (
    <View style={styles.chapter}>
      <View style={styles.chapterHeader}>
        <Text style={styles.title}>{chapterLabel}</Text>
        <View
          style={[
            styles.statusPill,
            isComplete && styles.statusPillComplete,
            isInProgress && styles.statusPillProgress,
          ]}
        >
          <Text
            style={[
              styles.status,
              isComplete && styles.complete,
              isInProgress && styles.inProgressText,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
      <CoverageBar
        count={section.practiced_count}
        total={section.available_count}
        label={`${chapterLabel} coverage`}
      />
      <Text style={styles.muted}>
        {section.practiced_count} / {section.available_count} questions practiced
      </Text>
    </View>
  );
}

function CoverageBar({ count, total, label }: { count: number; total: number; label: string }) {
  const percent = total ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}% practiced` }}
      style={styles.bar}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overviewBox: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.md,
  },
  sectionList: {
    gap: theme.spacing.sm,
  },
  summary: { color: theme.colors.success, fontWeight: "900", fontSize: 16 },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  title: { color: theme.colors.primary, flex: 1, fontSize: 15, fontWeight: "800" },
  statusPill: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPillComplete: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
  },
  statusPillProgress: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
  },
  status: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },
  complete: { color: theme.colors.success },
  inProgressText: { color: theme.colors.warning },
  module: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  moduleHeading: {
    backgroundColor: theme.colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  moduleHeadingOpen: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  moduleCopy: { flex: 1, gap: 2 },
  moduleChapters: {
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  toggleBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  toggleText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  chapter: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  chapterHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  bar: {
    height: 9,
    backgroundColor: "#DCE6F0",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.success,
    borderRadius: 999,
  },
});
