import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  replaceMock,
  onCloseMock,
  loginTriggerMock,
  dispatchMock,
  initiateMock,
  toastSuccessMock,
  searchParamsState,
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  onCloseMock: vi.fn(),
  loginTriggerMock: vi.fn(),
  dispatchMock: vi.fn(),
  initiateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  searchParamsState: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => dispatchMock,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: toastSuccessMock,
  },
}));

vi.mock("react-icons/fc", () => ({
  FcGoogle: () => <span data-testid="mock-google-icon">Google</span>,
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`mock-icon-${icon}`}>{icon}</span>,
}));

vi.mock("@/components/ui/TextInput", () => ({
  default: ({ id, name, value, onChange, type = "text", placeholder }: Record<string, unknown>) => (
    <input
      id={id as string}
      name={name as string}
      value={value as string}
      onChange={onChange as (event: React.ChangeEvent<HTMLInputElement>) => void}
      type={type as string}
      placeholder={placeholder as string}
    />
  ),
}));

vi.mock("@/components/ui/Checkbox", () => ({
  default: (props: Record<string, unknown>) => <input type="checkbox" {...props} />,
}));

vi.mock("@/store/api/auth/authApiSlice", () => ({
  authApiSlice: {
    endpoints: {
      getUserInfo: {
        initiate: initiateMock,
      },
    },
  },
  useLoginMutation: () => [loginTriggerMock, { isLoading: false }],
  useRegisterMutation: () => [vi.fn(), { isLoading: false }],
}));

import { AuthModal } from "../AuthModal";

describe("AuthModal login redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    searchParamsState.value = "";

    loginTriggerMock.mockReturnValue({
      unwrap: () => Promise.resolve({
        data: {
          portal: "user",
          defaultPath: null,
        },
      }),
    });

    initiateMock.mockReturnValue({ type: "auth/getUserInfo" });
    dispatchMock.mockImplementation(() => Object.assign(
      Promise.resolve({
        data: {
          data: {
            roles: [
              {
                type: 0,
                id: "transport-role",
                name: "TransportProvider",
              },
            ],
            portal: "user",
            defaultPath: null,
          },
        },
      }),
      {
        unsubscribe: vi.fn(),
      },
    ));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirects transport providers to the transport portal after login", async () => {
    const { container } = render(
      <AuthModal
        open
        onClose={onCloseMock}
        initialView="login"
      />,
    );

    fireEvent.change(container.querySelector("#login-email") as HTMLInputElement, {
      target: { name: "email", value: "thanh.ht@transport.vn" },
    });
    fireEvent.change(container.querySelector("#login-password") as HTMLInputElement, {
      target: { name: "password", value: "thehieu03" },
    });

    await act(async () => {
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    });

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/transport");
  });
});
