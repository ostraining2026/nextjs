// API types. Keep in step with docs/api-contract.md.

export type User = {
  id: number;
  full_name: string;
  email: string;
};

export type ChatMessage = {
  id: number;
  user_id: number;
  full_name: string;
  body: string;
  created_at: string;
};

export type DocumentItem = {
  id: number;
  description: string;
  file_name: string;
  size: number;
  created_at: string;
};

export type SharedDocumentItem = DocumentItem & {
  shared_by: { full_name: string; email: string };
};

export type DocumentsResponse = {
  mine: DocumentItem[];
  shared: SharedDocumentItem[];
};

export type SharesResponse = {
  shared_with: User[];
  candidates: User[];
};

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};
