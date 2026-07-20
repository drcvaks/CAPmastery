import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../../lib/constants/theme";

type AppLinkButtonProps = {
  href: Href;
  label: string;
  variant?: "primary" | "secondary";
};

export function AppLinkButton({ href, label, variant = "primary" }: AppLinkButtonProps) {
  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.button,
          variant === "secondary" && styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 13,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.76,
  },
  label: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryLabel: {
    color: theme.colors.primary,
  },
});
