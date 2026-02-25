"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
}

export function AIChat({ bookId, bookTitle, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setStreaming(true);

    try {
      const res = await fetch("/api/reader/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          message: userMessage,
          history: messages,
        }),
      });

      if (!res.ok) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Sorry, I couldn't process that question. Please try again.",
          },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n").filter(Boolean);

          for (const line of lines) {
            if (line === "data: [DONE]") break;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                assistantContent += data.text;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantContent },
                ]);
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="fixed right-0 top-[57px] z-30 flex h-[calc(100vh-57px)] w-96 flex-col border-l border-ink/[0.06] bg-paper-cool shadow-warm-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-ink-light" />
          <h3 className="text-sm font-medium text-ink">
            Talk to Your Book
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-paper-warm"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <Bot className="mx-auto h-10 w-10 text-ink-faint" />
            <p className="mt-3 text-sm text-ink-light">
              Ask anything about{" "}
              <span className="font-serif font-medium">{bookTitle}</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              I&apos;ll answer using the book&apos;s actual content.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-paper-warm">
                  <Bot className="h-4 w-4 text-ink-light" />
                </div>
              )}
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-ink text-paper"
                    : "bg-paper-warm text-ink"
                } max-w-[80%]`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-paper-warm">
                  <User className="h-4 w-4 text-ink-light" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-ink/[0.06] px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this book..."
            className="flex-1 rounded-md border border-ink/[0.08] bg-paper-warm/50 px-3 py-2 text-sm text-ink focus:border-ink-faint focus:outline-none focus:ring-1 focus:ring-ink-faint"
            disabled={streaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="rounded-md bg-ink p-2 text-paper transition-colors hover:bg-ink-light disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
