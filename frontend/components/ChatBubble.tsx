import clsx from "clsx";

export interface Message {
  role: "user" | "assistant";
  content: string;
  chunks?: number;
}

export default function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex animate-fade-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white rounded-br-sm"
            : "bg-slate-800 text-slate-100 rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {!isUser && msg.chunks !== undefined && (
          <p className="mt-1.5 text-xs text-slate-500">
            {msg.chunks} chunk{msg.chunks !== 1 ? "s" : ""} retrieved
          </p>
        )}
      </div>
    </div>
  );
}