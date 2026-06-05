import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCookieMock = vi.fn(() => null);

vi.mock("@/utils/cookie", () => ({
  getCookie: (...args: unknown[]) => getCookieMock(...args),
}));

vi.mock("@/configs/apiGateway", () => ({
  API_GATEWAY_BASE_URL: "http://localhost:5000",
}));

// Minimal BroadcastChannel mock wired as a shared event bus for same-process tests
class MockBroadcastChannel extends EventTarget {
  static instances: MockBroadcastChannel[] = [];
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown) {
    const event = new MessageEvent("message", { data });
    // Deliver to every other instance on the same channel
    for (const instance of MockBroadcastChannel.instances) {
      if (instance !== this && instance.name === this.name) {
        instance.dispatchEvent(event);
      }
    }
  }

  close() {
    MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter(
      (i) => i !== this,
    );
  }
}

describe("tokenRefreshCoordinator — BroadcastChannel coordination", () => {
  beforeEach(() => {
    MockBroadcastChannel.instances = [];
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    MockBroadcastChannel.instances = [];
    vi.resetModules();
  });

  it("fires only one POST when refreshAccessToken is called concurrently in the same tab", async () => {
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "token-A" } },
    });

    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    const [t1, t2] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(t1).toBe("token-A");
    expect(t2).toBe("token-A");
  });

  it("resolves queued waiters with token from external refresh-done broadcast", async () => {
    // Simulate another tab completing refresh: emit refresh-start then refresh-done
    // before our tab fires its own POST.
    vi.spyOn(axios, "post").mockImplementation(async () => {
      // This should NOT be called if the external broadcast resolves the queue
      throw new Error("unexpected POST");
    });

    const { refreshAccessToken } = await import("../tokenRefreshCoordinator");

    // Trigger the coordinator into isRefreshing=true via a broadcast-start from
    // another channel instance, then immediately deliver refresh-done.
    const externalChannel = new MockBroadcastChannel("auth-refresh");

    // Give the coordinator's channel listener a tick to register before broadcasting
    await Promise.resolve();

    externalChannel.postMessage({ type: "refresh-start", ts: Date.now() });
    // Give the module's listener time to process refresh-start
    await Promise.resolve();

    // Enqueue a waiter — it should NOT fire a POST since isRefreshing is now true
    const waitingPromise = refreshAccessToken();

    await Promise.resolve();

    // Now simulate the other tab finishing successfully
    externalChannel.postMessage({ type: "refresh-done", accessToken: "token-from-other-tab", ts: Date.now() });

    const result = await waitingPromise;
    expect(result).toBe("token-from-other-tab");
    externalChannel.close();
  });
});
