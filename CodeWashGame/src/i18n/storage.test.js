import { describe, it, expect, vi } from "vitest";
import { createStorage } from "./storage";

const fakeStore = (initial) => {
  const map = new Map(initial ? Object.entries(initial) : []);
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    snapshot: () => Object.fromEntries(map),
  };
};

const throwingStore = () => {
  throw new Error("storage unavailable");
};

describe("createStorage", () => {
  it("reads and writes through to the underlying store", () => {
    const store = fakeStore({ existing: "yes" });
    const storage = createStorage(() => store);

    expect(storage.getItem("existing")).toBe("yes");
    storage.setItem("language_v1", "fr");

    expect(store.snapshot()).toEqual({ existing: "yes", language_v1: "fr" });
  });

  it("reports a missing key as null", () => {
    expect(createStorage(() => fakeStore()).getItem("absent")).toBeNull();
  });

  it("returns null instead of throwing when the store is unreachable", () => {
    expect(createStorage(throwingStore).getItem("language_v1")).toBeNull();
  });

  it("swallows a failing write, so a full quota cannot break the game", () => {
    expect(() =>
      createStorage(throwingStore).setItem("language_v1", "fr"),
    ).not.toThrow();
  });

  it("swallows a store that rejects the write itself", () => {
    const store = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
    };

    expect(() =>
      createStorage(() => store).setItem("language_v1", "fr"),
    ).not.toThrow();
    expect(store.setItem).toHaveBeenCalledOnce();
  });
});
