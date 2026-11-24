import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiException } from "../lib/api";
import LoginForm from "./LoginForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "a@x.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Login" }));
}

describe("LoginForm", () => {
  beforeEach(() => push.mockClear());

  it("logs in and goes to the dashboard", async () => {
    const login = vi.spyOn(api, "login").mockResolvedValue({ id: 1, full_name: "Ann", email: "a@x.com" });
    render(<LoginForm />);
    await fillAndSubmit();
    expect(login).toHaveBeenCalledWith({ email: "a@x.com", password: "password123" });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the server error and stays on the page", async () => {
    vi.spyOn(api, "login").mockRejectedValue(new ApiException(401, "Invalid email or password."));
    render(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(push).not.toHaveBeenCalled();
  });
});
