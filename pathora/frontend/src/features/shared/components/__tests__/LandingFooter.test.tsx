import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock NSubstitute or NMock-like mock triggers
const { toastErrorMock, toastSuccessMock, subscribeNewsletterMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  subscribeNewsletterMock: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock("@/api/services/homeService", () => ({
  homeService: {
    subscribeNewsletter: subscribeNewsletterMock,
  },
}));

vi.mock("@/components/ui", () => ({
  Button: ({ type, text, className, onClick, isLoading, disabled }: any) => (
    <button type={type} className={className} onClick={onClick} disabled={disabled || isLoading}>
      {isLoading ? "Loading..." : text}
    </button>
  ),
  Icon: ({ icon }: { icon: string }) => <span data-testid={`mock-icon-${icon}`}>{icon}</span>,
  TextInput: ({ id, name, value, onChange, type = "text", placeholder, disabled }: Record<string, unknown>) => (
    <input
      id={id as string}
      name={name as string}
      value={value as string}
      onChange={onChange as any}
      type={type as string}
      placeholder={placeholder as string}
      disabled={disabled as boolean}
      data-testid="newsletter-input"
    />
  ),
}));

import { LandingFooter } from "../LandingFooter";

describe("LandingFooter Newsletter Subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render newsletter form with correct placeholder", () => {
    render(<LandingFooter />);
    expect(screen.getByTestId("newsletter-input")).toBeInTheDocument();
    expect(screen.getByText("landing.footer.newsletterNested.send")).toBeInTheDocument();
  });

  it("should show error toast if email is empty", async () => {
    const { container } = render(<LandingFooter />);
    const form = container.querySelector("form");

    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("landing.footer.newsletterNested.invalidEmail");
    expect(subscribeNewsletterMock).not.toHaveBeenCalled();
  });

  it("should show error toast if email is invalid format", async () => {
    render(<LandingFooter />);
    const input = screen.getByTestId("newsletter-input");
    const button = screen.getByText("landing.footer.newsletterNested.send");

    fireEvent.change(input, { target: { value: "invalid-email" } });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(toastErrorMock).toHaveBeenCalledWith("landing.footer.newsletterNested.invalidEmail");
    expect(subscribeNewsletterMock).not.toHaveBeenCalled();
  });

  it("should call homeService.subscribeNewsletter and show success toast on valid email submit", async () => {
    subscribeNewsletterMock.mockResolvedValueOnce({});
    render(<LandingFooter />);
    const input = screen.getByTestId("newsletter-input");
    const button = screen.getByText("landing.footer.newsletterNested.send");

    fireEvent.change(input, { target: { value: "test@example.com" } });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(subscribeNewsletterMock).toHaveBeenCalledWith("test@example.com");
      expect(toastSuccessMock).toHaveBeenCalledWith("landing.footer.newsletterNested.subscribeSuccess");
      expect((input as HTMLInputElement).value).toBe(""); // Form was reset
    });
  });

  it("should show error toast if api call fails", async () => {
    subscribeNewsletterMock.mockRejectedValueOnce(new Error("API Error"));
    render(<LandingFooter />);
    const input = screen.getByTestId("newsletter-input");
    const button = screen.getByText("landing.footer.newsletterNested.send");

    fireEvent.change(input, { target: { value: "test@example.com" } });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(subscribeNewsletterMock).toHaveBeenCalledWith("test@example.com");
    expect(toastErrorMock).toHaveBeenCalledWith("landing.footer.newsletterNested.subscribeError");
  });
});
