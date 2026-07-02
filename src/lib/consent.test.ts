import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { setConsent, useConsent } from "./consent";

const KEY = "haypile-analytics-consent";

afterEach(() => {
  window.localStorage.clear();
});

describe("consent", () => {
  it("defaults to null when nothing is stored", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current).toBeNull();
  });

  it("reflects a value already in localStorage", () => {
    window.localStorage.setItem(KEY, "granted");
    const { result } = renderHook(() => useConsent());
    expect(result.current).toBe("granted");
  });

  it("updates reactively when consent is set, and persists it", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current).toBeNull();

    act(() => setConsent("granted"));
    expect(result.current).toBe("granted");

    act(() => setConsent("denied"));
    expect(result.current).toBe("denied");
    expect(window.localStorage.getItem(KEY)).toBe("denied");
  });

  it("treats an unrecognised stored value as no choice", () => {
    window.localStorage.setItem(KEY, "maybe");
    const { result } = renderHook(() => useConsent());
    expect(result.current).toBeNull();
  });
});
