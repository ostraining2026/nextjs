import { describe, expect, it, vi } from "vitest";
import { api, ApiException } from "./api";

function mockFetch(response: Response | Error) {
  const fn = vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("api client", () => {
  it("returns parsed JSON and calls the /api path", async () => {
    const fetchMock = mockFetch(Response.json({ id: 1, full_name: "Ann", email: "a@x.com" }));
    const user = await api.me();
    expect(user.email).toBe("a@x.com");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({ credentials: "same-origin" }));
  });

  it("sends JSON bodies with the right method", async () => {
    const fetchMock = mockFetch(Response.json({ id: 1, full_name: "A", email: "a@x.com" }));
    await api.login({ email: "a@x.com", password: "secret123" });
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "a@x.com", password: "secret123" }));
  });

  it("handles 204 No Content", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(api.logout()).resolves.toBeUndefined();
  });

  it("throws ApiException with message, status and field errors", async () => {
    mockFetch(
      Response.json(
        { error: { code: "validation_error", message: "Please fix.", fields: { email: "Taken." } } },
        { status: 400 },
      ),
    );
    const err = await api
      .register({ full_name: "A", email: "a@x.com", password: "x", confirm_password: "x" })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiException);
    expect((err as ApiException).status).toBe(400);
    expect((err as ApiException).message).toBe("Please fix.");
    expect((err as ApiException).fields).toEqual({ email: "Taken." });
  });

  it("falls back to a generic message for non-JSON errors", async () => {
    mockFetch(new Response("Bad gateway", { status: 502 }));
    await expect(api.listUsers()).rejects.toMatchObject({ status: 502, message: expect.stringContaining("try again") });
  });

  it("reports an unreachable server", async () => {
    mockFetch(new TypeError("fetch failed"));
    await expect(api.listUsers()).rejects.toMatchObject({ status: 0, message: expect.stringContaining("Flask") });
  });

  it("builds the download URL", () => {
    expect(api.downloadUrl(7)).toBe("/api/documents/7/download");
  });
});
