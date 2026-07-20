import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppScreen } from "../../components/common/AppScreen";
import { AppTextField } from "../../components/common/AppTextField";
import { updatePasswordSchema, type UpdatePasswordValues } from "../../features/auth/schemas";
import { useAuth } from "../../features/auth/AuthProvider";
import { getSafeAuthMessage, updatePassword } from "../../services/authService";

export default function ResetPasswordScreen() {
  const auth = useAuth();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<UpdatePasswordValues>({
    defaultValues: { confirmPassword: "", password: "" },
    resolver: zodResolver(updatePasswordSchema),
  });

  if (!auth.session || !auth.passwordRecovery) {
    return (
      <AppScreen
        eyebrow="Account recovery"
        title="Open a valid reset link"
        description="This password-reset link is missing, invalid, or expired. Request a new link from the sign-in screen."
      >
        <AppCard title="Recovery session required">
          <AppLinkButton href="/forgot-password" label="Request another link" />
        </AppCard>
      </AppScreen>
    );
  }

  const submit = handleSubmit(async ({ password }) => {
    setRequestError(null);
    try {
      await updatePassword(password);
      auth.completePasswordRecovery();
      router.replace("/");
    } catch (error) {
      setRequestError(getSafeAuthMessage(error));
    }
  });

  return (
    <AppScreen
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use at least 10 characters with at least one letter and one number."
    >
      <AppCard title="New password" description={requestError ?? undefined}>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <AppTextField
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
        <AppButton label="Save password" loading={isSubmitting} onPress={() => void submit()} />
      </AppCard>
    </AppScreen>
  );
}
