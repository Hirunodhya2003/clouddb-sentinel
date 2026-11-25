// Owner: Member 06
// TODO: write tests
// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomerForm from "../components/customers/CustomerForm";
import CustomerTable from "../components/customers/CustomerTable";

afterEach(cleanup);

const customer = {
  id: 7,
  name: "Demo Customer",
  email: "demo@example.com",
  phone: "0771234567",
  status: "Active",
};

describe("CustomerForm", () => {
  it("submits trimmed customer information", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<CustomerForm onSave={onSave} onCancel={vi.fn()} />);

    await user.type(
      screen.getByLabelText(/customer name/i),
      "  New Customer  ",
    );
    await user.type(screen.getByLabelText(/^email$/i), "new@example.com");
    await user.type(screen.getByLabelText(/^phone$/i), "0771234567");

    await user.click(screen.getByRole("button", { name: /create customer/i }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({
      name: "New Customer",
      email: "new@example.com",
      phone: "0771234567",
      status: "Active",
    });
  });

  it("rejects a customer with a missing name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<CustomerForm onSave={onSave} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create customer/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/customer name/i)).toBeInvalid();
  });

  it("loads existing details and submits edits", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <CustomerForm
        initialCustomer={customer}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    const nameInput = screen.getByLabelText(/customer name/i);

    expect(nameInput).toHaveValue("Demo Customer");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("demo@example.com");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Customer");
    await user.selectOptions(screen.getByLabelText(/^status$/i), "Inactive");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledWith({
      name: "Updated Customer",
      email: "demo@example.com",
      phone: "0771234567",
      status: "Inactive",
    });
  });

  it("disables submission while saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <CustomerForm
        initialCustomer={customer}
        saving
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /saving/i });

    expect(button).toBeDisabled();
    expect(screen.getByLabelText(/customer name/i)).toBeDisabled();

    await user.click(button);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls cancel without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<CustomerForm onSave={onSave} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("CustomerTable", () => {
  it("sends the correct customer to each action", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CustomerTable
        customers={[customer]}
        search=""
        loading={false}
        error=""
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const row = screen.getByRole("row", { name: /Demo Customer/i });

    await user.click(within(row).getByRole("button", { name: "View" }));
    await user.click(within(row).getByRole("button", { name: "Edit" }));
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    expect(onView).toHaveBeenCalledWith(customer);
    expect(onEdit).toHaveBeenCalledWith(customer);
    expect(onDelete).toHaveBeenCalledWith(customer);
  });

  it("shows the no-match message for an empty search result", () => {
    render(
      <CustomerTable
        customers={[]}
        search="unknown"
        loading={false}
        error=""
      />,
    );

    expect(
      screen.getByText("No customers match your search."),
    ).toBeInTheDocument();
  });

  it("hides the empty-state message while loading", () => {
    render(<CustomerTable customers={[]} search="" loading error="" />);

    expect(
      screen.queryByText("No customers added yet."),
    ).not.toBeInTheDocument();
  });
});
