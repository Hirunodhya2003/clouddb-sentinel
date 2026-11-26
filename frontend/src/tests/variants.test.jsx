// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../components/variants/SizeSelector", () => ({
  default: ({ value, onChange, disabled }) => (
    <label>
      Size
      <select
        aria-label="Size"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select size</option>
        <option value="2">Medium</option>
      </select>
    </label>
  ),
}));

vi.mock("../components/variants/ColorSelector", () => ({
  default: ({ value, onChange, disabled }) => (
    <label>
      Color
      <select
        aria-label="Color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select color</option>
        <option value="3">Black</option>
      </select>
    </label>
  ),
}));

import VariantForm from "../components/variants/VariantForm";

afterEach(() => cleanup());
describe("VariantForm", () => {
  it("shows an error when required fields are missing", () => {
    render(<VariantForm onSubmit={vi.fn()} />);

    fireEvent.submit(document.querySelector("form"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please complete all required fields."
    );
  });

  it("submits the correct numeric payload", () => {
    const onSubmit = vi.fn();

    render(<VariantForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Product ID"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Size"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("SKU"), {
      target: { value: " TEST-001 " },
    });
    fireEvent.change(screen.getByLabelText("Cost Price"), {
      target: { value: "100.50" },
    });
    fireEvent.change(screen.getByLabelText("Selling Price"), {
      target: { value: "150.75" },
    });

    fireEvent.submit(document.querySelector("form"));

    expect(onSubmit).toHaveBeenCalledWith({
      product_id: 10,
      size_id: 2,
      colour_id: 3,
      sku: "TEST-001",
      cost_price: 100.5,
      selling_price: 150.75,
    });
  });

  it("rejects negative prices", () => {
    const onSubmit = vi.fn();

    render(
      <VariantForm
        initialData={{
          product_id: 10,
          size_id: 2,
          colour_id: 3,
          sku: "TEST-001",
          cost_price: "-5",
          selling_price: "150",
        }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.submit(document.querySelector("form"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Prices must be valid non-negative numbers."
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables fields and button while loading", () => {
    render(<VariantForm loading={true} />);

    expect(screen.getByLabelText("Product ID")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});
