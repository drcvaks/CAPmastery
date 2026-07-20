import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { AppLinkButton } from "../../components/common/AppLinkButton";
import { AppScreen } from "../../components/common/AppScreen";
import { AppTextField } from "../../components/common/AppTextField";
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
    <AppScreen
      eyebrow="CAP Mastery"
      title="Sign in"
      description="Use the email and password from your private CAP Mastery invitation."
    >
      <AppCard title="Account access" description={requestError ?? undefined}>
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
              autoComplete="current-password"
              error={fieldState.error?.message}
              label="Password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry
              value={field.value}
            />
          )}
        />
        <AppButton label="Sign in" loading={isSubmitting} onPress={() => void submit()} />
        <AppLinkButton href="/forgot-password" label="Forgot password?" variant="secondary" />
      </AppCard>
    </AppScreen>
  );
}
