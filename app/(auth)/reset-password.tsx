import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { AppButton } from "../../components/common/AppButton";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppTextField } from "../../components/common/AppTextField";
import { AuthShowcaseFrame } from "../../features/auth/components/AuthShowcaseFrame";
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
      <AuthShowcaseFrame
        activeTab="recovery"
        subtitle="This password-reset link is missing, invalid, or expired. Request a new link from the sign-in screen."
        title="Open a valid reset link"
      >
        <AppLinkButton href="/forgot-password" label="Request another link" />
      </AuthShowcaseFrame>
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
    <AuthShowcaseFrame
      activeTab="recovery"
      errorMessage={requestError}
      subtitle="Use at least 10 characters with at least one letter and one number."
      title="Choose a new password"
    >
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
    </AuthShowcaseFrame>
  );
}
