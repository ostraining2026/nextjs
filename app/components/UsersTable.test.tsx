import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import type { User } from "../lib/types";
import UsersTable from "./UsersTable";

const users: User[] = [
  { id: 1, full_name: "Ann Lee", email: "ann@x.com" },
  { id: 2, full_name: "Bob Ray", email: "bob@x.com" },
];

describe("UsersTable", () => {
  it("lists users with edit and delete actions", async () => {
    vi.spyOn(api, "listUsers").mockResolvedValue(users);
    render(<UsersTable />);
    expect(await screen.findByText("ann@x.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit Bob Ray" })).toHaveAttribute("href", "/users/2/edit");
    expect(screen.getByRole("button", { name: "Delete Bob Ray" })).toBeInTheDocument();
  });

  it("asks for confirmation, then deletes and reloads", async () => {
    const list = vi.spyOn(api, "listUsers").mockResolvedValueOnce(users).mockResolvedValueOnce([users[0]]);
    const del = vi.spyOn(api, "deleteUser").mockResolvedValue(undefined);
    render(<UsersTable />);
    await userEvent.click(await screen.findByRole("button", { name: "Delete Bob Ray" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm User Deletion" });
    expect(del).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "OK" }));

    expect(del).toHaveBeenCalledWith(2);
    expect(list).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("bob@x.com")).not.toBeInTheDocument();
  });

  it("does not delete when Cancel is pressed", async () => {
    vi.spyOn(api, "listUsers").mockResolvedValue(users);
    const del = vi.spyOn(api, "deleteUser").mockResolvedValue(undefined);
    render(<UsersTable />);
    await userEvent.click(await screen.findByRole("button", { name: "Delete Ann Lee" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(del).not.toHaveBeenCalled();
  });

  it("shows an error if loading fails", async () => {
    vi.spyOn(api, "listUsers").mockRejectedValue(new Error("Cannot reach the server."));
    render(<UsersTable />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server.");
  });
});
