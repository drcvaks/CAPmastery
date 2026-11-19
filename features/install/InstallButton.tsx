import { Image, Pressable, StyleSheet, Text } from "react-native";
import { useInstall } from "./InstallContext";
import { theme } from "../../lib/constants/theme";

const logo = require("../../assets/cap-mastery-logo.png");

export function InstallButton({ dark = false, onOpen }: { dark?: boolean; onOpen?: () => void }) {
  const install = useInstall();
  if (!install || install.installed) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Install CAP Mastery"
      onPress={() => {
        onOpen?.();
        install.open();
      }}
      style={({ pressed }) => [styles.button, dark && styles.dark, pressed && { opacity: 0.8 }]}
    >
      <Image
        source={logo}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.text, dark && { color: theme.colors.surface }]}>
        Install CAP Mastery
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    marginVertical: 8,
  },
  dark: { backgroundColor: theme.colors.primaryLight, borderColor: "#536E97" },
  logo: { width: 32, height: 32, borderRadius: 6 },
  text: { color: theme.colors.primary, fontSize: 14, fontWeight: "800", flexShrink: 1 },
});
