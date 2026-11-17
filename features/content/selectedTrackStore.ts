type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
type Snapshot = { id?: string; ready: boolean };

export function createSelectedTrackStore(storage: Storage) {
  const entries = new Map<
    string,
    {
      snapshot: Snapshot;
      listeners: Set<() => void>;
      loading?: Promise<void>;
      writes: Promise<unknown>;
    }
  >();
  function entry(user: string) {
    let value = entries.get(user);
    if (!value) {
      value = { snapshot: { ready: false }, listeners: new Set(), writes: Promise.resolve() };
      entries.set(user, value);
    }
    return value;
  }
  function publish(user: string, snapshot: Snapshot) {
    const current = entry(user);
    current.snapshot = snapshot;
    current.listeners.forEach((listener) => listener());
  }
  return {
    snapshot: (user: string) => entry(user).snapshot,
    subscribe(user: string, listener: () => void) {
      entry(user).listeners.add(listener);
      return () => {
        entry(user).listeners.delete(listener);
      };
    },
    load(user: string) {
      const current = entry(user);
      if (current.snapshot.ready) return Promise.resolve();
      if (!current.loading) {
        current.loading = storage
          .getItem(`cap-mastery:study-track:${user}`)
          .then((id) => {
            if (!current.snapshot.ready) publish(user, { id: id || undefined, ready: true });
          })
          .catch(() => {
            if (!current.snapshot.ready) publish(user, { ready: true });
          });
      }
      return current.loading;
    },
    select(user: string, id: string) {
      const current = entry(user);
      if (current.snapshot.ready && current.snapshot.id === id) return;
      publish(user, { id, ready: true });
      current.writes = current.writes
        .catch(() => undefined)
        .then(() => storage.setItem(`cap-mastery:study-track:${user}`, id))
        .catch(() => undefined);
    },
  };
}
