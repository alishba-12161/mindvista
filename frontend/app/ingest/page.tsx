"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import FileUpload from "@/components/FileUpload";
import { ingestText, ingestFile } from "@/lib/api";

type Mode = "text" | "file";
type Status = "idle" | "loading" | "success" | "error";

export default function IngestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [chunks, setChunks] = useState(0);

  async function handleProcess() {
    if (mode === "text" && !text.trim()) return;
    if (mode === "file" && !file) return;
    setStatus("loading");
    try {
      const res = mode === "text" ? await ingestText(text) : await ingestFile(file!);
      setChunks(res.chunk_count);
      setMessage(res.message);
      setStatus("success");
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-2xl px-6 pt-28 pb-16">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            RAG-powered assistant
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Knowledge Base</h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Paste your content below. The AI answers strictly from this material — nothing else.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex gap-2">
            {(["text", "file"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all border ${
                  mode === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-slate-400 border-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {m === "text" ? "📝 Paste Text" : "📁 Upload File"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your FAQ, product docs, notes, or any text here…"
              rows={12}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
          ) : (
            <FileUpload onFile={setFile} />
          )}

          <button
            onClick={handleProcess}
            disabled={status === "loading" || (mode === "text" ? !text.trim() : !file)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processing…
              </>
            ) : "⚡ Process Content"}
          </button>
        </div>

        {status === "success" && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="font-medium text-emerald-300">✓ Content indexed successfully</p>
            <p className="mt-1 text-sm text-emerald-500">
              Split into <span className="font-semibold text-emerald-300">{chunks} chunks</span> and stored in vector memory.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Start Chatting →
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">⚠ {message}</p>
          </div>
        )}
      </main>
    </>
  );
}