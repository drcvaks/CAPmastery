import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "../../../lib/constants/theme";

type VisualAid = {
  altText: string;
  caption: string;
  height: number;
  uri: string;
  width: number;
};

type VisualAidViewerProps = {
  onImageError: () => void;
  visual: VisualAid;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function VisualAidViewer({ onImageError, visual }: VisualAidViewerProps) {
  const [fullScreen, setFullScreen] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    if (!fullScreen) {
      setZoom(MIN_ZOOM);
    }
  }, [fullScreen]);

  const fittedSize = useMemo(() => {
    const viewportWidth = Math.max(240, windowWidth - theme.spacing.lg * 2);
    const viewportHeight = Math.max(240, windowHeight - 170);
    const aspectRatio = visual.width / visual.height;
    let width = viewportWidth;
    let height = width / aspectRatio;

    if (height > viewportHeight) {
      height = viewportHeight;
      width = height * aspectRatio;
    }

    return { height, viewportHeight, viewportWidth, width };
  }, [visual.height, visual.width, windowHeight, windowWidth]);

  const close = () => setFullScreen(false);
  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <Image
        accessibilityLabel={visual.altText}
        accessible
        onError={onImageError}
        resizeMode="contain"
        source={{ uri: visual.uri }}
        style={[styles.inlineVisual, { aspectRatio: visual.width / visual.height }]}
        testID="visual-aid-image"
      />
      <Text style={styles.caption}>{visual.caption}</Text>
      <Pressable
        accessibilityLabel="Open visual full screen"
        accessibilityRole="button"
        onPress={() => setFullScreen(true)}
        style={({ pressed }) => [styles.openButton, pressed && styles.controlPressed]}
      >
        <Text style={styles.openButtonText}>Open full screen and zoom</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={close}
        presentationStyle="fullScreen"
        visible={fullScreen}
      >
        <View
          accessibilityLabel="Full-screen visual viewer"
          style={styles.modal}
          testID="full-screen-visual-viewer"
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHeading}>
              <Text numberOfLines={2} style={styles.modalTitle}>
                {visual.caption}
              </Text>
              <Text style={styles.zoomLabel}>{zoomPercent}%</Text>
            </View>
            <Pressable
              accessibilityLabel="Close visual"
              accessibilityRole="button"
              onPress={close}
              style={({ pressed }) => [styles.closeButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.viewport}>
            <ScrollView
              centerContent
              contentContainerStyle={styles.horizontalScrollContent}
              horizontal
              maximumZoomScale={MAX_ZOOM}
              minimumZoomScale={MIN_ZOOM}
              showsHorizontalScrollIndicator
            >
              <ScrollView
                centerContent
                contentContainerStyle={styles.verticalScrollContent}
                showsVerticalScrollIndicator
                style={{
                  height: fittedSize.viewportHeight,
                  width: Math.max(fittedSize.viewportWidth, fittedSize.width * zoom),
                }}
              >
                <Image
                  accessibilityLabel={visual.altText}
                  accessible
                  onError={() => {
                    close();
                    onImageError();
                  }}
                  resizeMode="contain"
                  source={{ uri: visual.uri }}
                  style={{ height: fittedSize.height * zoom, width: fittedSize.width * zoom }}
                  testID="full-screen-visual-image"
                />
              </ScrollView>
            </ScrollView>
          </View>

          <View style={styles.zoomControls}>
            <ZoomButton
              disabled={zoom <= MIN_ZOOM}
              label="Zoom out"
              onPress={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
              text="−"
            />
            <ZoomButton
              disabled={zoom === MIN_ZOOM}
              label="Reset zoom"
              onPress={() => setZoom(MIN_ZOOM)}
              text="Reset"
            />
            <ZoomButton
              disabled={zoom >= MAX_ZOOM}
              label="Zoom in"
              onPress={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
              text="+"
            />
          </View>
          <Text style={styles.hint}>Zoom in, then scroll to inspect small text and details.</Text>
        </View>
      </Modal>
    </>
  );
}

function ZoomButton({
  disabled,
  label,
  onPress,
  text,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.zoomButton,
        pressed && !disabled && styles.controlPressed,
        disabled && styles.controlDisabled,
      ]}
    >
      <Text style={styles.zoomButtonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caption: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  closeButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  closeButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  controlDisabled: { opacity: 0.4 },
  controlPressed: { opacity: 0.75 },
  hint: { color: "#D8E2EC", fontSize: 13, textAlign: "center" },
  horizontalScrollContent: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: "100%",
  },
  inlineVisual: { alignSelf: "flex-start", maxHeight: 480, width: "100%" },
  modal: {
    backgroundColor: "#071421",
    flex: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  modalHeading: { flex: 1 },
  modalTitle: { color: theme.colors.surface, fontSize: 17, fontWeight: "800", lineHeight: 22 },
  openButton: {
    alignItems: "center",
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  openButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  verticalScrollContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  viewport: { flex: 1, overflow: "hidden" },
  zoomButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: theme.spacing.md,
  },
  zoomButtonText: { color: theme.colors.primary, fontSize: 18, fontWeight: "900" },
  zoomControls: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "center",
  },
  zoomLabel: { color: "#D8E2EC", fontSize: 13, marginTop: 2 },
});
