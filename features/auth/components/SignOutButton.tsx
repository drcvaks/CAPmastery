import { useState } from "react";

import { AppButton } from "../../../components/common/AppButton";
import { useAuth } from "../AuthProvider";

export function SignOutButton() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <AppButton
      label="Sign out"
      loading={loading}
      onPress={() => {
        setLoading(true);
        void auth
          .signOut()
          .catch(() => undefined)
          .finally(() => setLoading(false));
      }}
      variant="secondary"
    />
  );
}
