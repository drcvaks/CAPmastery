import type { TextInputProps } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "../../lib/constants/theme";

type AppTextFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AppTextField({ error, label, ...inputProps }: AppTextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityHint={error || inputProps.accessibilityHint}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.subtle}
        style={[styles.input, inputProps.style, error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    color: theme.colors.inkSecondary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    color: theme.colors.ink,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inputError: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
