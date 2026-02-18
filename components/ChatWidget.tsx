// components/ChatWidget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Meow! 🐾 I'm Frederick, your academic assistant. Ask me about your assignments, get help with French, or just chat about your semester!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        const text = data.content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("\n");
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          style={{
            background: "linear-gradient(135deg, var(--green-deep), var(--green-mid))",
            border: "2px solid var(--gold-mid)",
            borderRadius: "50%",
            width: "70px",
            height: "70px",
            boxShadow: "0 4px 20px rgba(45, 74, 62, 0.4), 0 0 0 0 rgba(196, 150, 31, 0.4)",
            animation: "pulse 2s infinite",
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-200">
              <Image
                src="/frederick.png"
                alt="Frederick"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
          </div>
        </button>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(45, 74, 62, 0.4), 0 0 0 0 rgba(196, 150, 31, 0.4); }
          50% { box-shadow: 0 4px 20px rgba(45, 74, 62, 0.4), 0 0 0 10px rgba(196, 150, 31, 0); }
        }
      `}</style>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col victorian-card"
          style={{
            width: "400px",
            maxWidth: "calc(100vw - 48px)",
            height: "600px",
            maxHeight: "calc(100vh - 100px)",
            boxShadow: "0 10px 40px rgba(26, 18, 9, 0.2)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: "linear-gradient(135deg, var(--green-deep), var(--green-mid))",
              borderColor: "var(--gold-mid)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-200">
                <Image src="/frederick.png" alt="Frederick" width={40} height={40} />
              </div>
              <div>
                <p className="font-['Playfair_Display'] font-bold text-amber-100 text-sm">
                  Frederick
                </p>
                <p className="text-xs text-green-200 font-['Lora'] italic">
                  Your Academic Assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-200 hover:text-amber-100 transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200"
                      : "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
                  }`}
                >
                  <p
                    className="text-sm font-['Source_Sans_3'] whitespace-pre-wrap"
                    style={{ color: "var(--ink)" }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t"
            style={{ borderColor: "var(--parchment-deep)" }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Frederick anything..."
                className="flex-1 victorian-input text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
