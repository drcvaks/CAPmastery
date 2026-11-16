import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/common/AppButton";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppTextField } from "../../components/common/AppTextField";
import { AuthShowcaseFrame } from "../../features/auth/components/AuthShowcaseFrame";
import { signUpSchema, type SignUpValues } from "../../features/auth/schemas";
import { getSafeAuthMessage, signUpWithPassword } from "../../services/authService";

export default function SignUpScreen() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<SignUpValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      const email = values.email.trim().toLowerCase();
      const result = await signUpWithPassword({
        email,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(email);
      }
    } catch (error) {
      setRequestError(getSafeAuthMessage(error));
    }
  });

  if (confirmationEmail) {
    return (
      <AuthShowcaseFrame
        activeTab="sign-up"
        subtitle={`We sent a confirmation link to ${confirmationEmail}.`}
        title="Check your email"
      >
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>Confirm your account</Text>
          <Text style={styles.confirmDescription}>
            After confirming your email, an administrator must assign your Student workspace and
            study packets.
          </Text>
        </View>
        <AppLinkButton href="/sign-in" label="Back to sign in" />
      </AuthShowcaseFrame>
    );
  }

  return (
    <AuthShowcaseFrame
      activeTab="sign-up"
      errorMessage={requestError}
      subtitle="Create your login first. An administrator will then assign your Student workspace and study packets."
      title="Create account"
    >
      <View style={styles.nameRow}>
        <View style={styles.nameCol}>
          <Controller
            control={control}
            name="firstName"
            render={({ field, fieldState }) => (
              <AppTextField
                autoCapitalize="words"
                autoComplete="given-name"
                error={fieldState.error?.message}
                label="First name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </View>
        <View style={styles.nameCol}>
          <Controller
            control={control}
            name="lastName"
            render={({ field, fieldState }) => (
              <AppTextField
                autoCapitalize="words"
                autoComplete="family-name"
                error={fieldState.error?.message}
                label="Last name (optional)"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </View>
      </View>

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
            autoComplete="new-password"
            error={fieldState.error?.message}
            label="Password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <AppTextField
            autoCapitalize="none"
            autoComplete="new-password"
            error={fieldState.error?.message}
            label="Confirm password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      <AppButton label="Create account" loading={isSubmitting} onPress={() => void submit()} />
      <AppLinkButton
        href="/sign-in"
        label="Already have an account? Sign in"
        variant="secondary"
      />
    </AuthShowcaseFrame>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nameCol: {
    flexBasis: 170,
    flexGrow: 1,
    minWidth: 0,
  },
  confirmBox: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  confirmTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  confirmDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
});
