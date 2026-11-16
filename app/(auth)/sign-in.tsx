import { zodResolver } from "@hookform/resolvers/zod";
import { type Href, Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/common/AppButton";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppTextField } from "../../components/common/AppTextField";
import { AuthShowcaseFrame } from "../../features/auth/components/AuthShowcaseFrame";
import { signInSchema, type SignInValues } from "../../features/auth/schemas";
import { getSafeAuthMessage, signInWithPassword } from "../../services/authService";

export default function SignInScreen() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignInValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(signInSchema),
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      await signInWithPassword(values.email.trim(), values.password);
    } catch (error) {
      setRequestError(getSafeAuthMessage(error));
    }
  });

  return (
    <AuthShowcaseFrame
      activeTab="sign-in"
      errorMessage={requestError}
      subtitle="Sign in with your CAP Mastery email and password."
      title="Sign In"
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <AppTextField
            autoCapitalize="none"
            autoComplete="email"
            error={fieldState.error?.message}
            keyboardType="email-address"
            label="Email"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="cadet@example.com"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <AppTextField
            autoCapitalize="none"
            autoComplete="current-password"
            error={fieldState.error?.message}
            label="Password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Enter your password"
            secureTextEntry
            value={field.value}
          />
        )}
      />

      <View style={styles.primaryActionWrap}>
        <AppButton label="Sign in" loading={isSubmitting} onPress={() => void submit()} />
      </View>

      <View style={styles.secondaryActionRow}>
        <AppLinkButton href="/forgot-password" label="Forgot password?" variant="secondary" />
      </View>

      <View style={styles.createAccountRow}>
        <Link asChild href={"/sign-up" as Href}>
          <Pressable accessibilityRole="link" style={styles.createAccountLink}>
            <Text style={styles.createAccountText}>Create account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShowcaseFrame>
  );
}

const styles = StyleSheet.create({
  primaryActionWrap: {
    marginTop: 2,
  },
  secondaryActionRow: {
    alignItems: "flex-start",
  },
  createAccountRow: {
    alignItems: "flex-start",
    paddingTop: 2,
  },
  createAccountLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  createAccountText: {
    color: "#042454",
    fontSize: 13,
    fontWeight: "800",
  },
});
