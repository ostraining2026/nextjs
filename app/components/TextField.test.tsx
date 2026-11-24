import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TextField from "./TextField";

describe("TextField", () => {
  it("links the visible label to the input", () => {
    render(<TextField name="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
  });

  it("shows no error state by default", () => {
    render(<TextField name="email" label="Email" />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("exposes the error to assistive tech", () => {
    render(<TextField name="email" label="Email" error="Enter a valid email address." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address.");
  });
});
