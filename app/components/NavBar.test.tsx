import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import NavBar from "./NavBar";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/users",
}));

describe("NavBar", () => {
  it("shows the four required items in order", () => {
    render(<NavBar />);
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Group Chat", "Manage Users", "Manage Documents", "Logout"]);
  });

  it("marks the current page", () => {
    render(<NavBar />);
    expect(screen.getByRole("link", { name: "Manage Users" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Group Chat" })).not.toHaveAttribute("aria-current");
  });

  it("logs out and returns home with the logged-out flag", async () => {
    const logout = vi.spyOn(api, "logout").mockResolvedValue(undefined);
    render(<NavBar />);
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/?loggedout=1");
  });
});
