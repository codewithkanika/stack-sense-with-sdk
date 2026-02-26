import { ChatMessage } from "@/store/evaluationStore";

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, timestamp } = message;

  // System messages: centered, muted
  if (role === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-md rounded-lg bg-zinc-100 px-4 py-2 text-center text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <p>{content}</p>
          <time className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">
            {formatTime(timestamp)}
          </time>
        </div>
      </div>
    );
  }

  // User messages: right-aligned, blue
  if (role === "user") {
    return (
      <div className="flex justify-end my-1.5">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-white shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
          <time className="mt-1 block text-right text-xs text-blue-200">
            {formatTime(timestamp)}
          </time>
        </div>
      </div>
    );
  }

  // Agent messages: left-aligned, gray
  return (
    <div className="flex justify-start my-1.5">
      <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-2.5 shadow-sm dark:bg-zinc-800">
        <p className="text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap dark:text-zinc-200">
          {content}
        </p>
        <time className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">
          {formatTime(timestamp)}
        </time>
      </div>
    </div>
  );
}
