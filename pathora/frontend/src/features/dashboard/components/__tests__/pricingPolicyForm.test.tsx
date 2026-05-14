import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PricingPolicyForm } from "../PricingPolicyForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("@phosphor-icons/react", () => ({
  PencilSimple: () => <span data-testid="mock-pencil-icon" />,
  TagIcon: () => <span data-testid="mock-tag-icon" />,
}));

vi.mock("../PricingTierInput", () => ({
  PricingTierInput: () => <div data-testid="mock-pricing-tier-input" />,
}));

vi.mock("../TranslationTabForm", () => ({
  TranslationTabForm: () => <div data-testid="mock-translation-tab-form" />,
}));

describe("PricingPolicyForm", () => {
  it("checks the default policy checkbox when clicking the label text", () => {
    render(
      <PricingPolicyForm
        policy={null}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const defaultCheckbox = screen.getByRole("checkbox", {
      name: "Set as default policy",
    });

    expect(defaultCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByText("Set as default policy"));

    expect(defaultCheckbox).toBeChecked();
  });
});
