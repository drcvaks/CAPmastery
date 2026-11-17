import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useOptionalAuth } from "../../auth/AuthContext";
import { createSelectedTrackStore } from "../selectedTrackStore";

const tracks = createSelectedTrackStore(AsyncStorage);
const empty = { ready: true, id: undefined };
const noop = () => undefined;

export function useSelectedExamTrack(availableIds: string[], defaultId?: string) {
  const userId = useOptionalAuth()?.session?.user.id;
  const [localId, setLocalId] = useState<string>();
  const stored = useSyncExternalStore(
    (listener) => (userId ? tracks.subscribe(userId, listener) : noop),
    () => (userId ? tracks.snapshot(userId) : empty),
  );
  const preferredId = userId ? stored.id : localId;
  const id = preferredId && availableIds.includes(preferredId) ? preferredId : defaultId;

  useEffect(() => {
    if (userId) void tracks.load(userId);
  }, [userId]);
  useEffect(() => {
    // Set an initial track once, but keep a remembered track if a screen's
    // temporarily different catalog does not contain it.
    if (userId && stored.ready && !stored.id && defaultId) tracks.select(userId, defaultId);
  }, [userId, stored.ready, stored.id, defaultId]);

  return [
    id,
    (next: string) => {
      if (!availableIds.includes(next)) return;
      if (userId) tracks.select(userId, next);
      else setLocalId(next);
    },
  ] as const;
}
