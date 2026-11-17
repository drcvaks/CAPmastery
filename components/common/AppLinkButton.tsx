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
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
  },
  pressed: {
    opacity: 0.85,
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
});
