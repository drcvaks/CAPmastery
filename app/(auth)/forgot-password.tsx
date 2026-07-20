import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppScreen } from "../../components/common/AppScreen";
import { AppTextField } from "../../components/common/AppTextField";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestValues,
} from "../../features/auth/schemas";
import { getSafeAuthMessage, sendPasswordReset } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<PasswordResetRequestValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const submit = handleSubmit(async ({ email }) => {
    setRequestError(null);
    setMessage(null);
    try {
      await sendPasswordReset(email.trim());
      setMessage("If that invited account exists, a password-reset message has been sent.");
    } catch (error) {
      setRequestError(getSafeAuthMessage(error));
    }
  });

  return (
    <AppScreen
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter the email associated with your CAP Mastery invitation."
    >
      <AppCard title="Recovery email" description={requestError ?? message ?? undefined}>
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
        <AppButton label="Send reset link" loading={isSubmitting} onPress={() => void submit()} />
        <AppLinkButton href="/sign-in" label="Back to sign in" variant="secondary" />
      </AppCard>
    </AppScreen>
  );
}
