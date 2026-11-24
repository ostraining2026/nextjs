import type {
  ApiErrorBody,
  ChatMessage,
  DocumentItem,
  DocumentsResponse,
  SharesResponse,
  User,
} from "./types";

export class ApiException extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { credentials: "same-origin", ...init });
  } catch {
    throw new ApiException(0, "Cannot reach the server. Is the Flask backend running?");
  }
  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // non-JSON error (for example the proxy could not reach Flask)
    }
    throw new ApiException(
      res.status,
      body.error?.message ?? "Something went wrong. Please try again.",
      body.error?.fields,
    );
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function json(method: string, data?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  };
}

export const api = {
  // auth
  register: (data: { full_name: string; email: string; password: string; confirm_password: string }) =>
    request<User>("/auth/register", json("POST", data)),
  login: (data: { email: string; password: string }) => request<User>("/auth/login", json("POST", data)),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  // users
  listUsers: () => request<User[]>("/users"),
  getUser: (id: number) => request<User>(`/users/${id}`),
  updateUser: (id: number, data: { full_name: string; email: string }) =>
    request<User>(`/users/${id}`, json("PUT", data)),
  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),

  // messages
  listMessages: () => request<ChatMessage[]>("/messages"),
  sendMessage: (body: string) => request<ChatMessage>("/messages", json("POST", { body })),

  // documents
  listDocuments: () => request<DocumentsResponse>("/documents"),
  uploadDocument: (form: FormData) => request<DocumentItem>("/documents", { method: "POST", body: form }),
  updateDocument: (id: number, description: string) =>
    request<DocumentItem>(`/documents/${id}`, json("PUT", { description })),
  deleteDocument: (id: number) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  downloadUrl: (id: number) => `/api/documents/${id}/download`,

  // shares
  listShares: (id: number) => request<SharesResponse>(`/documents/${id}/shares`),
  addShare: (id: number, userId: number) =>
    request<void>(`/documents/${id}/shares`, json("POST", { user_id: userId })),
  removeShare: (id: number, userId: number) =>
    request<void>(`/documents/${id}/shares/${userId}`, { method: "DELETE" }),
};
