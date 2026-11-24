import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiException } from "../lib/api";
import RegisterForm from "./RegisterForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("RegisterForm", () => {
  beforeEach(() => push.mockClear());

  it("has a visible label for every field", () => {
    render(<RegisterForm />);
    for (const label of ["Full Name", "Email", /^Password/, "Confirm Password"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("registers and goes to the success page", async () => {
    const register = vi.spyOn(api, "register").mockResolvedValue({ id: 1, full_name: "Ann", email: "a@x.com" });
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Full Name"), "Ann");
    await userEvent.type(screen.getByLabelText("Email"), "a@x.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(register).toHaveBeenCalledWith({
      full_name: "Ann",
      email: "a@x.com",
      password: "password123",
      confirm_password: "password123",
    });
    expect(push).toHaveBeenCalledWith("/registration-success");
  });

  it("shows field errors from the server next to the fields", async () => {
    vi.spyOn(api, "register").mockRejectedValue(
      new ApiException(400, "Please fix the highlighted fields.", {
        email: "Email is already registered.",
        confirm_password: "Passwords do not match.",
      }),
    );
    render(<RegisterForm />);
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(await screen.findByText("Email is already registered.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
