"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiException } from "../lib/api";
import type { ChatMessage } from "../lib/types";
import Button from "./Button";
import FormMessage from "./FormMessage";

const POLL_MS = 5000;

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setMessages(await api.listMessages());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const body = String(new FormData(formEl).get("body") ?? "").trim();
    if (!body) return;
    setSending(true);
    try {
      await api.sendMessage(body);
      formEl.reset();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <FormMessage message={error} />
      <div
        role="log"
        aria-label="Group chat messages"
        className="mb-4 h-80 overflow-y-auto rounded-md border border-slate-400 bg-white p-3 text-sm"
      >
        {messages.length === 0 ? <p className="text-slate-700">No messages yet.</p> : null}
        {messages.map((m) => (
          <p key={m.id} className="mb-1">
            <span className="text-slate-700">[{new Date(m.created_at).toLocaleString()}]</span>{" "}
            <strong>{m.full_name}</strong> : {m.body}
          </p>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="chat-body" className="mb-1 block text-sm font-medium">
            Message
          </label>
          <input
            id="chat-body"
            name="body"
            maxLength={1000}
            autoComplete="off"
            required
            className="block w-full rounded-md border border-slate-500 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          />
        </div>
        <Button type="submit" disabled={sending}>
          Send
        </Button>
        <Button variant="secondary" onClick={() => void refresh()}>
          Refresh
        </Button>
      </form>
    </>
  );
}
