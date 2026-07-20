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
      accessibilityRole="button"
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
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
  },
  label: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryLabel: {
    color: theme.colors.primary,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.55,
  },
});
