"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { askQuestion, resetKnowledge, getStatus } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  chunks?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [indexed, setIndexed] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getStatus().then((s) => setIndexed(s.indexed)).catch(() => setIndexed(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await askQuestion(q);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, chunks: res.retrieved_chunks }]);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Request failed. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (indexed === false) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-6">
          <div className="text-5xl">🧠</div>
          <h2 className="text-xl font-semibold text-white">No knowledge base yet</h2>
          <p className="text-sm text-slate-400 max-w-xs">Add some content before asking questions.</p>
          <button
            onClick={() => router.push("/ingest")}
            className="mt-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
          >
            Add Content →
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen pt-16">
        <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between max-w-3xl mx-auto w-full">
          <div>
            <h1 className="text-sm font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-slate-500 mt-0.5">Answers strictly from your content</p>
          </div>
          <button
            onClick={async () => { await resetKnowledge(); setMessages([]); router.push("/ingest"); }}
            className="text-xs text-slate-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg px-3 py-1.5 transition"
          >
            🗑 Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8 flex flex-col gap-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="text-4xl">💬</div>
                <p className="text-sm text-slate-500">Ask anything about your uploaded content.</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    AI
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white/10 text-slate-100 border border-white/10 rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.role === "assistant" && m.chunks !== undefined && (
                    <p className="mt-2 pt-2 text-xs text-slate-500 border-t border-white/10">
                      {m.chunks} chunk{m.chunks !== 1 ? "s" : ""} retrieved
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  AI
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ⚠ {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-6 py-4 flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask a question… (Enter to send)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition max-h-36"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white text-lg transition hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </>
  );
}