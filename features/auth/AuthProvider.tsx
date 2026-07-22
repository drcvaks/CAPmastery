import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getSupabaseClient, startNativeAuthAutoRefresh } from "../../lib/supabase/client";
import {
  exchangeRecoveryUrl,
  fetchAccessContext,
  getSafeAuthMessage,
  signOut as requestSignOut,
} from "../../services/authService";
import type { AccessContext } from "./types";

type AuthStatus = "configuration_missing" | "error" | "loading" | "signed_in" | "signed_out";

type AuthContextValue = {
  access: AccessContext | null;
  completePasswordRecovery: () => void;
  errorMessage: string | null;
  passwordRecovery: boolean;
  refreshAccess: () => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<AccessContext | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const requestId = useRef(0);
  const activeUserId = useRef<string | null>(null);
  const activeAccess = useRef<AccessContext | null>(null);

  const loadSession = useCallback(async (nextSession: Session | null) => {
    const currentRequest = ++requestId.current;
    activeUserId.current = nextSession?.user.id ?? null;
    setSession(nextSession);
    setAccess(null);
    activeAccess.current = null;
    setErrorMessage(null);

    if (!nextSession) {
      setStatus("signed_out");
      return;
    }

    setStatus("loading");
    try {
      const nextAccess = await fetchAccessContext(nextSession.user.id);
      if (requestId.current === currentRequest) {
        activeAccess.current = nextAccess;
        setAccess(nextAccess);
        setStatus("signed_in");
      }
    } catch (error) {
      if (requestId.current === currentRequest) {
        setErrorMessage(getSafeAuthMessage(error));
        setStatus("error");
      }
    }
  }, []);

  const refreshAccess = useCallback(async () => {
    await loadSession(session);
  }, [loadSession, session]);

  useEffect(() => {
    let mounted = true;
    let stopRefresh: () => void = () => undefined;
    let authSubscription: { unsubscribe: () => void } = { unsubscribe: () => undefined };
    let linkingSubscription: { remove: () => void } = { remove: () => undefined };

    try {
      const supabase = getSupabaseClient();
      stopRefresh = startNativeAuthAutoRefresh(supabase);

      authSubscription = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (mounted) {
          if (event === "PASSWORD_RECOVERY") {
            setPasswordRecovery(true);
          } else if (event === "SIGNED_OUT") {
            setPasswordRecovery(false);
          }
          if (nextSession && activeAccess.current && activeUserId.current === nextSession.user.id) {
            setSession(nextSession);
            return;
          }
          setTimeout(() => {
            if (mounted) {
              void loadSession(nextSession);
            }
          }, 0);
        }
      }).data.subscription;

      void supabase.auth.getSession().then(({ data, error }) => {
        if (!mounted) {
          return;
        }
        if (error) {
          setErrorMessage(getSafeAuthMessage(error));
          setStatus("error");
          return;
        }
        void loadSession(data.session);
      });

      if (Platform.OS !== "web") {
        const handleUrl = ({ url }: { url: string }) => {
          if (url.includes("reset-password")) {
            setPasswordRecovery(true);
          }
          void exchangeRecoveryUrl(url).catch((error: unknown) => {
            if (mounted) {
              setErrorMessage(getSafeAuthMessage(error));
              setStatus("error");
            }
          });
        };

        linkingSubscription = Linking.addEventListener("url", handleUrl);
        void Linking.getInitialURL().then((url) => {
          if (url && mounted) {
            handleUrl({ url });
          }
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Supabase is not configured.");
      setStatus("configuration_missing");
    }

    return () => {
      mounted = false;
      requestId.current += 1;
      authSubscription.unsubscribe();
      linkingSubscription.remove();
      stopRefresh();
    };
  }, [loadSession]);

  const signOut = useCallback(async () => {
    await requestSignOut();
  }, []);

  const completePasswordRecovery = useCallback(() => {
    setPasswordRecovery(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      access,
      completePasswordRecovery,
      errorMessage,
      passwordRecovery,
      refreshAccess,
      session,
      signOut,
      status,
    }),
    [
      access,
      completePasswordRecovery,
      errorMessage,
      passwordRecovery,
      refreshAccess,
      session,
      signOut,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}
