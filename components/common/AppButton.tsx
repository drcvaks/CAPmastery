import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../../lib/constants/theme";

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

export function AppButton({
  disabled = false,
  label,
  loading = false,
  onPress,
  variant = "primary",
}: AppButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityLabel={`${label}, loading`}
          color={variant === "primary" ? theme.colors.surface : theme.colors.primary}
        />
      ) : (
        <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
  },
  label: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  secondaryLabel: {
    color: theme.colors.inkSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
