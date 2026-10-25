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
      {isModular
        ? modules.map((number) => {
            const sections = track.sections.filter((section) => section.module_number === number);
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
                  style={styles.moduleHeading}
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
                  <Text style={styles.title}>{open ? "−" : "+"}</Text>
                </Pressable>
                {open
                  ? sections.map((section) => (
                      <ChapterCoverage key={section.topic_id} section={section} />
                    ))
                  : null}
              </View>
            );
          })
        : track.sections.map((section) => (
            <ChapterCoverage key={section.topic_id} section={section} />
          ))}
    </AppCard>
  );
}

function ChapterCoverage({ section }: { section: MissionTrack["sections"][number] }) {
  const chapterLabel =
    section.chapter_number && !/^chapter\s+\d+/i.test(section.chapter_title)
      ? `Chapter ${section.chapter_number}: ${section.chapter_title}`
      : section.chapter_title;
  const status =
    section.practiced_count >= section.available_count
      ? "All questions practiced"
      : section.practiced_count > 0
        ? "In progress"
        : "Not started";
  return (
    <View style={styles.chapter}>
      <Text style={styles.title}>{chapterLabel}</Text>
      <Text
        style={[
          styles.status,
          section.practiced_count >= section.available_count && styles.complete,
        ]}
      >
        {status}
      </Text>
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
  summary: { color: theme.colors.success, fontWeight: "900", fontSize: 17 },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 20 },
  title: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  status: { color: theme.colors.muted, fontSize: 13, fontWeight: "700" },
  complete: { color: theme.colors.success },
  module: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  moduleHeading: {
    backgroundColor: theme.colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: 56,
    padding: theme.spacing.md,
  },
  moduleCopy: { flex: 1 },
  chapter: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  bar: { height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: theme.colors.success },
});
