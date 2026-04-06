import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { AdminErrorCard } from "../AdminErrorCard";

const renderComponent = (props: React.ComponentProps<typeof AdminErrorCard>) => {
  return render(<AdminErrorCard {...props} />);
};

describe("AdminErrorCard", () => {
  it("renders error message", () => {
    renderComponent({ message: "Không thể tải dữ liệu." });

    expect(screen.getByText("Không thể tải dữ liệu.")).toBeInTheDocument();
  });

  it("renders default error message when no message provided", () => {
    renderComponent({});

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    renderComponent({ message: "Server error", onRetry: () => {} });

    expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    renderComponent({ message: "Error", onRetry });

    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when onRetry is omitted", () => {
    renderComponent({ message: "Error without retry" });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses red background and border colors", () => {
    renderComponent({ message: "Error" });

    const card = screen.getByTestId("admin-error-card");
    expect(card).toHaveStyle({
      backgroundColor: "#FEF2F2",
      borderColor: "#FECACA",
    });
  });
});
