"use client";
import { useRef, useState } from "react";

interface Props {
  onFile: (f: File | null) => void;
}

export default function FileUpload({ onFile }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function handle(f: File) {
    setFile(f);
    onFile(f);
  }

  function clear() {
    setFile(null);
    onFile(null);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith(".txt")) handle(f);
      }}
      onClick={() => !file && ref.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer ${
        dragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20 bg-white/5"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      {file ? (
        <>
          <p className="text-sm font-medium text-white">{file.name}</p>
          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          <button
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="absolute top-2 right-3 text-slate-500 hover:text-red-400 text-lg transition"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <div className="text-3xl">📁</div>
          <p className="text-sm text-slate-400">
            Drop a <span className="text-white font-medium">.txt</span> file or click to browse
          </p>
        </>
      )}
    </div>
  );
}