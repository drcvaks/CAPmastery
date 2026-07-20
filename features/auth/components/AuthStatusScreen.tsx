import { ActivityIndicator, Text } from "react-native";

import { AppCard } from "../../../components/common/AppCard";
import { AppScreen } from "../../../components/common/AppScreen";
import { theme } from "../../../lib/constants/theme";

type AuthStatusScreenProps = {
  description: string;
  title: string;
};

export function AuthStatusScreen({ description, title }: AuthStatusScreenProps) {
  return (
    <AppScreen eyebrow="Secure access" title={title} description={description}>
      <AppCard title="Please wait">
        <ActivityIndicator accessibilityLabel="Loading account" color={theme.colors.accent} />
        <Text style={{ color: theme.colors.muted }}>
          Checking the current session and permissions.
        </Text>
      </AppCard>
    </AppScreen>
  );
}
