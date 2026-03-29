"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-full max-w-4xl items-center justify-between px-6">
        <Link href="/ingest" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            M
          </div>
          <span className="font-semibold text-white">MindVista</span>
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {[{ href: "/ingest", label: "Knowledge" }, { href: "/chat", label: "Chat" }].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all no-underline ${
                path === href ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}