import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

function setup(open = true, error: string | null = null) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open={open}
      title="Confirm User Deletion"
      message="Are you sure?"
      error={error}
      busy={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("renders title, message and buttons when open", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Confirm User Deletion" })).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("renders no content when closed", () => {
    setup(false);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("calls onConfirm on OK and onCancel on Cancel", async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows an error message", () => {
    setup(true, "Could not delete.");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not delete.");
  });
});
