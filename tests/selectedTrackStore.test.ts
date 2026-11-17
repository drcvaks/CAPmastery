import { createSelectedTrackStore } from "../features/content/selectedTrackStore";

it("remembers a cadet's explicit selection across reloads without changing another cadet", async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
  const store = createSelectedTrackStore(storage);
  await store.load("cadet-a");
  store.select("cadet-a", "aerospace");
  store.select("cadet-b", "leadership");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const reloaded = createSelectedTrackStore(storage);
  await reloaded.load("cadet-a");
  await reloaded.load("cadet-b");
  expect(reloaded.snapshot("cadet-a").id).toBe("aerospace");
  expect(reloaded.snapshot("cadet-b").id).toBe("leadership");
});

it("does not replace a newer selection when an older saved value finishes loading", async () => {
  let finish!: (value: string) => void;
  const store = createSelectedTrackStore({
    getItem: () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    setItem: jest.fn().mockResolvedValue(undefined),
  });
  const changed = jest.fn();
  const unsubscribe = store.subscribe("cadet", changed);
  const loading = store.load("cadet");
  store.select("cadet", "earhart");
  finish("leadership");
  await loading;
  expect(store.snapshot("cadet").id).toBe("earhart");
  expect(changed).toHaveBeenCalledTimes(1);
  unsubscribe();
});
