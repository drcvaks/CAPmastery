import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { pickLearningVisual } from "../../../services/visualFilePicker";
import { VisualAidViewer } from "../../study/components/VisualAidViewer";
import {
  useAdminVisuals,
  useAdminVisualUrl,
  useReplaceAdminVisual,
} from "../hooks/useAdminVisuals";
import { visualLibraryGroups, type LearningVisual, type PickedVisual } from "../visuals";

export function VisualLibraryAdmin() {
  const library = useAdminVisuals();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [notice, setNotice] = useState("");
  const selected = library.data?.find((item) => item.asset_key === selectedKey);
  if (selected)
    return (
      <VisualEditor
        key={`${selected.asset_key}:${selected.storage_path}`}
        visual={selected}
        onBack={() => setSelectedKey(undefined)}
        onSaved={() => {
          setSelectedKey(undefined);
          setNotice(
            "Replacement saved. Every linked question will use the corrected image when reloaded.",
          );
        }}
      />
    );
  const filter = query.toLowerCase().trim();
  const visuals =
    library.data?.filter((item) =>
      `${item.asset_key} ${item.alt_text} ${item.locations.map((loc) => `${loc.exam_title} ${loc.chapter_title} ${loc.module_number ?? ""}`).join(" ")}`
        .toLowerCase()
        .includes(filter),
    ) ?? [];
  return (
    <View style={styles.stack}>
      <AppCard
        title="Image library"
        description="Browse by test and chapter/module. Open an image to enlarge it or upload a corrected replacement."
      >
        <AppTextField
          label="Search images, tests, or chapters"
          value={query}
          onChangeText={setQuery}
        />
        <Text style={styles.muted}>
          {library.data?.length ?? 0} registered images. Shared images appear in each chapter that
          uses them.
        </Text>
        {notice ? (
          <Text accessibilityRole="alert" style={styles.success}>
            {notice}
          </Text>
        ) : null}
        <AppButton
          label="Refresh image library"
          variant="secondary"
          onPress={() => void library.refetch()}
        />
        {library.isPending ? <Text>Loading images…</Text> : null}
        {library.isError ? <ErrorText error={library.error} /> : null}
        {library.data && visuals.length === 0 ? <Text>No images match this search.</Text> : null}
      </AppCard>
      {visualLibraryGroups(visuals).map((group) => {
        const open = expanded.includes(group.id) || Boolean(filter);
        return (
          <AppCard key={group.id} title={group.title}>
            <AppButton
              label={`${open ? "Collapse" : "Expand"} ${group.title}`}
              variant="secondary"
              onPress={() =>
                setExpanded((current) =>
                  current.includes(group.id)
                    ? current.filter((id) => id !== group.id)
                    : [...current, group.id],
                )
              }
            />
            {open
              ? group.sections.map(([label, items]) => (
                  <VisualSection
                    key={label}
                    label={label}
                    items={items}
                    onSelect={setSelectedKey}
                  />
                ))
              : null}
          </AppCard>
        );
      })}
    </View>
  );
}

function VisualSection({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: LearningVisual[];
  onSelect: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${label}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.sectionHeader}
      >
        <Text style={styles.heading}>
          {expanded ? "▾" : "▸"} {label}
        </Text>
        <Text style={styles.muted}>
          {items.length} {items.length === 1 ? "image" : "images"}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={styles.grid}>
          {items.map((visual) => (
            <VisualThumbnail
              key={visual.asset_key}
              visual={visual}
              onPress={() => onSelect(visual.asset_key)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function VisualThumbnail({ visual, onPress }: { visual: LearningVisual; onPress: () => void }) {
  const url = useAdminVisualUrl(visual.storage_path);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${visual.alt_text}`}
      onPress={onPress}
      style={styles.thumbnail}
    >
      {url.data ? (
        <Image
          accessibilityLabel={visual.alt_text}
          source={{ uri: url.data }}
          resizeMode="contain"
          style={styles.image}
        />
      ) : (
        <Text style={styles.muted}>
          {url.isError ? "Preview unavailable — open to retry" : "Loading preview…"}
        </Text>
      )}
      <Text numberOfLines={2} style={styles.heading}>
        {visual.alt_text}
      </Text>
      <Text style={styles.muted}>
        {visual.asset_key} · {visual.status}
      </Text>
      <Text style={styles.action}>View / replace image →</Text>
    </Pressable>
  );
}

function VisualEditor({
  visual,
  onBack,
  onSaved,
}: {
  visual: LearningVisual;
  onBack: () => void;
  onSaved: () => void;
}) {
  const url = useAdminVisualUrl(visual.storage_path);
  const replace = useReplaceAdminVisual();
  const [file, setFile] = useState<PickedVisual | null>(null);
  const [altText, setAltText] = useState(visual.alt_text);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [picking, setPicking] = useState(false);
  const [imageError, setImageError] = useState(false);
  async function choose() {
    setPicking(true);
    setError(undefined);
    try {
      const picked = await pickLearningVisual();
      if (picked) {
        setFile(picked);
        setImageError(false);
        replace.reset();
      }
    } catch (value) {
      setError(value);
    } finally {
      setPicking(false);
    }
  }
  async function save() {
    if (!file) return;
    try {
      await replace.mutateAsync({ visual, file, altText, reason });
      onSaved();
    } catch {
      /* A failed or uncertain activation asks the administrator to refresh. */
    }
  }
  const uri = file?.uri ?? url.data;
  return (
    <View style={styles.stack}>
      <AppButton
        label="Back to image library"
        variant="secondary"
        disabled={replace.isPending || picking}
        onPress={onBack}
      />
      <AppCard
        title={visual.alt_text}
        description={`${visual.asset_key} · ${visual.width} × ${visual.height} · ${visual.status}`}
      >
        <Text style={styles.heading}>Used in</Text>
        {visual.locations.map((loc, i) => (
          <Text key={i} style={styles.muted}>
            {loc.exam_title} · {loc.module_number ? `Module ${loc.module_number} · ` : ""}
            {loc.chapter_title} · {loc.question_count} questions
          </Text>
        ))}
        {!visual.locations.length ? (
          <Text style={styles.muted}>No question currently uses this registered image.</Text>
        ) : null}
        <Text style={styles.muted}>
          Replacing this shared image updates every question listed above. Existing question text,
          captions, and scores are unchanged. The previous file is retained.
        </Text>
        {uri ? (
          <VisualAidViewer
            key={uri}
            visual={{
              uri,
              width: file?.width ?? visual.width,
              height: file?.height ?? visual.height,
              altText,
              caption: file ? `Replacement preview: ${file.name}` : "Current image",
            }}
            onImageError={() => setImageError(true)}
          />
        ) : (
          <Text>Loading image…</Text>
        )}
        {url.isError ? (
          <>
            <ErrorText error={url.error} />
            <AppButton
              label="Retry image preview"
              variant="secondary"
              onPress={() => void url.refetch()}
            />
          </>
        ) : null}
        {imageError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            Image preview could not load. Choose another file or reopen this image.
          </Text>
        ) : null}
        <AppButton
          label="Choose replacement PNG"
          variant="secondary"
          loading={picking}
          disabled={replace.isPending}
          onPress={() => void choose()}
        />
        <Text style={styles.muted}>
          PNG only, up to 5 MB. Review the replacement preview before saving. Approval status stays
          unchanged.
        </Text>
        {file ? (
          <>
            <Text>
              {file.name} · {file.width} × {file.height}
            </Text>
            <AppTextField
              label="Image description (accessibility)"
              value={altText}
              onChangeText={setAltText}
              editable={!replace.isPending}
              maxLength={1000}
              multiline
            />
            <AppTextField
              label="Reason for replacement (at least 10 characters)"
              value={reason}
              onChangeText={setReason}
              editable={!replace.isPending}
              maxLength={500}
              multiline
            />
            <AppButton
              label="Save replacement"
              loading={replace.isPending}
              disabled={imageError || !altText.trim() || reason.trim().length < 10}
              onPress={() => void save()}
            />
            <AppButton
              label="Discard replacement"
              variant="secondary"
              disabled={replace.isPending}
              onPress={() => {
                setFile(null);
                setAltText(visual.alt_text);
                setReason("");
                setImageError(false);
                replace.reset();
              }}
            />
          </>
        ) : null}
        {error ? <ErrorText error={error} /> : null}
        {replace.isError ? <ErrorText error={replace.error} /> : null}
      </AppCard>
    </View>
  );
}

function ErrorText({ error }: { error: unknown }) {
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {error instanceof Error
        ? error.message
        : "The image request failed. Refresh the library and try again."}
    </Text>
  );
}
const styles = StyleSheet.create({
  sectionHeader: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minHeight: 48,
    gap: theme.spacing.xs,
  },
  stack: { gap: theme.spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  thumbnail: {
    flexGrow: 1,
    flexBasis: 250,
    maxWidth: 440,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  image: { width: "100%", height: 160 },
  heading: { fontSize: 16, fontWeight: "700", color: theme.colors.ink },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  action: { color: theme.colors.accent, fontWeight: "700" },
  error: { color: theme.colors.danger },
  success: { color: theme.colors.success, fontWeight: "700" },
});
