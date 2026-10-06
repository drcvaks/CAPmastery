import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppScreen } from "../../components/common/AppScreen";
import { AppTextField } from "../../components/common/AppTextField";
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
      <AppScreen
        eyebrow="CAP Mastery"
        title="Check your email"
        description={`We sent a confirmation link to ${confirmationEmail}.`}
      >
        <AppCard
          title="Confirm your account"
          description="After confirming your email, an administrator must assign your Student workspace and study packets."
        >
          <AppLinkButton href="/sign-in" label="Back to sign in" />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      eyebrow="CAP Mastery"
      title="Create account"
      description="Create your login first. An administrator will then assign your Student workspace and study packets."
    >
      <AppCard title="New cadet account" description={requestError ?? undefined}>
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
      </AppCard>
    </AppScreen>
  );
}
