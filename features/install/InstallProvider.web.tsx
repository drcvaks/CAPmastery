import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname } from "expo-router";
import { AppButton } from "../../components/common/AppButton";
import { useOptionalAuth } from "../auth/AuthContext";
import { theme } from "../../lib/constants/theme";
import { InstallContext } from "./InstallContext";
import { installInstructions } from "./installSupport";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const logo = require("../../assets/cap-mastery-logo.png");
const invitedUsers = new Set<string>();

export function InstallProvider({ children }: PropsWithChildren) {
  const auth = useOptionalAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shownFor, setShownFor] = useState<string>();
  const [installed, setInstalled] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)),
  );
  const [canPrompt, setCanPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const deferred = useRef<InstallEvent | null>(null);
  const userId = auth?.status === "signed_in" ? auth.session?.user.id : undefined;
  const ready = Boolean(
    userId && !auth?.passwordRecovery && auth?.access?.profile.status === "active",
  );
  const [instructions] = useState(() =>
    typeof window === "undefined"
      ? installInstructions("")
      : installInstructions(window.navigator.userAgent, window.navigator.maxTouchPoints),
  );

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const refreshInstalled = () =>
      setInstalled(
        media.matches ||
          Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone),
      );
    const capture = (event: Event) => {
      event.preventDefault();
      deferred.current = event as InstallEvent;
      setCanPrompt(true);
    };
    const installedApp = () => {
      deferred.current = null;
      setCanPrompt(false);
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installedApp);
    media.addEventListener("change", refreshInstalled);
    if (!__DEV__ && window.isSecureContext && "serviceWorker" in window.navigator) {
      void window.navigator.serviceWorker
        .register("/service-worker.js", { updateViaCache: "none" })
        .catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installedApp);
      media.removeEventListener("change", refreshInstalled);
    };
  }, []);

  const markInvited = useCallback(() => {
    if (!userId) return;
    invitedUsers.add(userId);
    try {
      window.localStorage.setItem(`cap-mastery:install-invited:${userId}`, "1");
    } catch {
      // The in-memory marker still avoids repeated invitations during this visit.
    }
  }, [userId]);
  const show = useCallback(() => {
    markInvited();
    setShownFor(userId);
    setMessage("");
    setOpen(true);
  }, [markInvited, userId]);

  useEffect(() => {
    if (
      !ready ||
      !userId ||
      installed ||
      pathname.includes("/session/") ||
      pathname === "/challenge"
    )
      return;
    if (invitedUsers.has(userId)) return;
    try {
      if (window.localStorage.getItem(`cap-mastery:install-invited:${userId}`)) return;
    } catch {
      /* Private browsing may block persistent storage. */
    }
    const timer = setTimeout(show, 1000);
    return () => clearTimeout(timer);
  }, [ready, userId, installed, pathname, show]);

  async function install() {
    const event = deferred.current;
    if (!event || busy) return;
    // prompt() must be invoked directly from the user gesture and only once.
    deferred.current = null;
    setCanPrompt(false);
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Follow your browser's confirmation to finish installing."
          : "No problem. You can install later from either menu.",
      );
    } catch {
      setMessage(
        "The browser could not open the install prompt. Use the browser menu instructions below.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <InstallContext.Provider value={ready ? { installed, open: show } : null}>
      {children}
      <Modal
        visible={open && shownFor === userId && ready && !installed}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.heading}>
                <Image
                  source={logo}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="CAP Mastery logo"
                />
                <View style={{ flex: 1 }}>
                  <Text accessibilityRole="header" style={styles.title}>
                    Install CAP Mastery
                  </Text>
                  <Text style={styles.copy}>
                    A shortcut to your next mission—on your home screen, desktop, or dock.
                  </Text>
                </View>
              </View>
              <Text style={styles.copy}>
                This installs the web app, not an App Store or Google Play download. An internet
                connection is required to study and save answers.
              </Text>
              <Text style={styles.subheading}>{instructions.title}</Text>
              {instructions.steps.map((step, index) => (
                <Text key={step} style={styles.copy}>
                  {index + 1}. {step}
                </Text>
              ))}
              <Text style={styles.copy}>
                You may need to sign in again when opening the installed app.
              </Text>
              {message ? (
                <Text accessibilityRole="alert" style={styles.copy}>
                  {message}
                </Text>
              ) : null}
              {canPrompt ? (
                <AppButton label="Install now" loading={busy} onPress={() => void install()} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={message ? "Close install guide" : "Maybe later"}
                disabled={busy}
                onPress={() => setOpen(false)}
                style={styles.close}
              >
                <Text style={styles.subheading}>{message ? "Close" : "Maybe later"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </InstallContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,22,54,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    width: "100%",
    maxWidth: 560,
    maxHeight: "90%",
  },
  content: { padding: 24, gap: 16 },
  heading: { flexDirection: "row", alignItems: "center", gap: 14 },
  logo: { width: 72, height: 72, borderRadius: 12 },
  title: { color: theme.colors.primary, fontSize: 24, fontWeight: "900" },
  subheading: { color: theme.colors.primary, fontSize: 16, fontWeight: "800" },
  copy: { color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  close: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
});
