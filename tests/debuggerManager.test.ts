import { beforeEach, describe, expect, it, vi } from "vitest";
import { OWNED_TABS_STORAGE_KEY } from "../src/shared/constants";
import { DebuggerManager } from "../src/background/debuggerManager";

let store: Record<string, unknown>;
let attach: ReturnType<typeof vi.fn>;
let detach: ReturnType<typeof vi.fn>;
let sendCommand: ReturnType<typeof vi.fn>;

function installChromeMock(): void {
  attach = vi.fn(async () => undefined);
  detach = vi.fn(async () => undefined);
  sendCommand = vi.fn(async () => undefined);
  const local = {
    get: vi.fn(async (key: string) => (Object.hasOwn(store, key) ? { [key]: store[key] } : {})),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
  };
  vi.stubGlobal("chrome", {
    debugger: {
      attach,
      detach,
      sendCommand,
      onDetach: { addListener: vi.fn() },
    },
    storage: { local },
  } as unknown as typeof chrome);
}

describe("DebuggerManager", () => {
  beforeEach(() => {
    store = {};
    vi.unstubAllGlobals();
    installChromeMock();
  });

  it("attaches, applies a timezone, clears it, and detaches only its own session", async () => {
    const manager = new DebuggerManager();
    await manager.initialize();
    expect(await manager.reconcileTab(7, "Asia/Tokyo")).toEqual({ active: true });
    expect(attach).toHaveBeenCalledWith({ tabId: 7 }, "1.3");
    expect(sendCommand).toHaveBeenCalledWith({ tabId: 7 }, "Emulation.setTimezoneOverride", {
      timezoneId: "Asia/Tokyo",
    });

    expect(await manager.reconcileTab(7, null)).toEqual({ active: false });
    expect(sendCommand).toHaveBeenLastCalledWith({ tabId: 7 }, "Emulation.setTimezoneOverride", {
      timezoneId: "",
    });
    expect(detach).toHaveBeenCalledWith({ tabId: 7 });
    expect(manager.isAttached(7)).toBe(false);
  });

  it("recovers a persisted session by sending a command without attaching twice", async () => {
    store[OWNED_TABS_STORAGE_KEY] = [9];
    const manager = new DebuggerManager();
    await manager.initialize();
    expect(await manager.reconcileTab(9, "Europe/London")).toEqual({ active: true });
    expect(attach).not.toHaveBeenCalled();
    expect(sendCommand).toHaveBeenCalledWith({ tabId: 9 }, "Emulation.setTimezoneOverride", {
      timezoneId: "Europe/London",
    });
  });

  it("does not detach a recovery candidate when ownership cannot be confirmed", async () => {
    store[OWNED_TABS_STORAGE_KEY] = [12];
    sendCommand.mockRejectedValueOnce(new Error("Debugger is not attached"));
    const manager = new DebuggerManager();
    await manager.initialize();
    expect(await manager.reconcileTab(12, null)).toEqual({ active: false });
    expect(detach).not.toHaveBeenCalled();
    expect(attach).not.toHaveBeenCalled();
  });

  it("reports debugger conflicts without retrying in a loop", async () => {
    attach.mockRejectedValue(new Error("Another debugger is already attached"));
    const manager = new DebuggerManager();
    await manager.initialize();
    expect(await manager.reconcileTab(3, "America/New_York")).toEqual({
      active: false,
      error: "Another debugger may already be attached to this tab.",
    });
    expect(await manager.reconcileTab(3, "America/New_York")).toEqual({
      active: false,
      error: "Another debugger may already be attached to this tab.",
    });
    expect(attach).toHaveBeenCalledTimes(2);
  });
});
