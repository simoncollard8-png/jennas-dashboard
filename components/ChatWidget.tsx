// components/ChatWidget.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type AnimationState = "idle" | "thinking" | "talking";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ─── Animation speed per state ─────────────────────────────────────────────

const ANIM_SPEED: Record<AnimationState, number> = {
  idle: 0.55,       // slow, calm
  thinking: 2.2,   // fast, frantic
  talking: 1.1,    // normal, active
};

// ─── Text-to-Speech Hook ───────────────────────────────────────────────────

function useSpeech() {
  // Default ON; reads from localStorage once mounted
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);

  // Hydrate from localStorage and wait for voices to load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("frederick-voice");
    if (stored !== null) setVoiceEnabled(stored !== "false");

    const loadVoices = () => {
      if (speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined") return null;
    const voices = speechSynthesis.getVoices();
    // Prefer British English, then any English female, then any English
    return (
      voices.find((v) => v.lang === "en-GB" && /female|woman|kate|hazel|serena/i.test(v.name)) ||
      voices.find((v) => v.lang === "en-GB") ||
      voices.find((v) => v.lang === "en-AU") ||
      voices.find((v) => /samantha|karen|moira/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }, [voicesReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = useCallback(
    (text: string, index: number) => {
      if (!voiceEnabled || typeof window === "undefined") return;
      speechSynthesis.cancel();
      setSpeakingIndex(null);

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getPreferredVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = 1.08;
      utterance.volume = 1;
      utterance.onstart = () => setSpeakingIndex(index);
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);

      // Small delay lets the browser finish any previous cancel()
      setTimeout(() => speechSynthesis.speak(utterance), 80);
    },
    [voiceEnabled, getPreferredVoice]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined") speechSynthesis.cancel();
    setSpeakingIndex(null);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("frederick-voice", String(next));
      if (!next && typeof window !== "undefined") speechSynthesis.cancel();
      return next;
    });
  }, []);

  return { voiceEnabled, toggleVoice, speak, stop, speakingIndex };
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Meow! 🐾 I'm Frederick, your academic assistant. Ask me about your assignments, get help with French, or just chat about your semester!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [animState, setAnimState] = useState<AnimationState>("idle");

  // Lottie animation loading state
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [lottieFailed, setLottieFailed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const talkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { voiceEnabled, toggleVoice, speak, stop, speakingIndex } = useSpeech();

  // ── Load Lottie animation JSON ──────────────────────────────────────────
  useEffect(() => {
    fetch(
      "https://assets-v2.lottiefiles.com/a/a5ac50ce-117e-11ee-bad7-ffc5621ef811/C2bD6nlsqb.json"
    )
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => setAnimationData(data))
      .catch(() => setLottieFailed(true));
  }, []);

  // ── Sync animation speed to state ──────────────────────────────────────
  useEffect(() => {
    if (!lottieRef.current || !animationData) return;
    lottieRef.current.setSpeed(ANIM_SPEED[animState]);
  }, [animState, animationData]);

  // ── Scroll to latest message ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setAnimState("thinking");

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
        setAnimState("idle");
      } else {
        const text = data.content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("\n");

        setMessages((prev) => {
          const updated = [...prev, { role: "assistant" as const, content: text }];
          const newIndex = updated.length - 1;
          // Auto-speak after state settles
          setTimeout(() => speak(text, newIndex), 100);
          return updated;
        });

        setAnimState("talking");
        if (talkingTimerRef.current) clearTimeout(talkingTimerRef.current);
        talkingTimerRef.current = setTimeout(() => setAnimState("idle"), 3500);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again!",
        },
      ]);
      setAnimState("idle");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived style values per animation state ────────────────────────────
  const borderGlow =
    animState === "thinking"
      ? { color: "#fcd34d", shadow: "0 0 10px #fcd34d60" }
      : animState === "talking"
      ? { color: "#6ee7b7", shadow: "0 0 10px #6ee7b760" }
      : { color: "#fde68a", shadow: "none" };

  const statusDot =
    animState === "thinking"
      ? "bg-amber-400 animate-pulse"
      : animState === "talking"
      ? "bg-emerald-400 animate-pulse"
      : "bg-gray-400/70";

  const statusText =
    animState === "thinking"
      ? "thinking…"
      : animState === "talking"
      ? "speaking…"
      : "Your Academic Assistant";

  const statusColor =
    animState === "thinking"
      ? "#fcd34d"
      : animState === "talking"
      ? "#86efac"
      : "#d1fae5";

  // ── Frederick avatar (Lottie or PNG fallback) ───────────────────────────
  const FredAvatar = ({ size }: { size: "sm" | "lg" }) => {
    const px = size === "sm" ? 48 : 40;
    const cls = size === "sm" ? "w-12 h-12" : "w-10 h-10";

    return (
      <div
        className={`${cls} rounded-full overflow-hidden relative flex-shrink-0`}
        style={{
          border: `2px solid ${borderGlow.color}`,
          boxShadow: borderGlow.shadow,
          transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        {animationData && !lottieFailed ? (
          <Lottie
            lottieRef={size === "lg" ? lottieRef : undefined}
            animationData={animationData}
            loop
            autoplay
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Image
            src="/frederick.png"
            alt="Frederick"
            width={px}
            height={px}
            className={`object-cover w-full h-full ${
              animState === "thinking"
                ? "animate-pulse"
                : animState === "talking"
                ? "brightness-110"
                : ""
            }`}
          />
        )}

        {/* State indicator dot */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${statusDot}`}
        />
      </div>
    );
  };

  // ── Speaker button for each Frederick message ───────────────────────────
  const SpeakerButton = ({ content, index }: { content: string; index: number }) => {
    const isPlaying = speakingIndex === index;
    return (
      <button
        onClick={() => (isPlaying ? stop() : speak(content, index))}
        title={isPlaying ? "Stop reading" : "Read aloud"}
        className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 transition-colors mt-1 px-1 select-none"
      >
        <span className={isPlaying ? "animate-pulse" : "opacity-70"}>
          {isPlaying ? "🔊" : "🔈"}
        </span>
        <span className="font-['Source_Sans_3']">
          {isPlaying ? "Stop" : "Read aloud"}
        </span>
      </button>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Frederick chat"
          className="fixed bottom-6 right-6 z-50"
          style={{
            background: "linear-gradient(135deg, var(--green-deep), var(--green-mid))",
            border: "2px solid var(--gold-mid)",
            borderRadius: "50%",
            width: "70px",
            height: "70px",
            animation: "fredPulse 2.4s ease-in-out infinite",
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <FredAvatar size="sm" />
          </div>
        </button>
      )}

      <style jsx>{`
        @keyframes fredPulse {
          0%,
          100% {
            box-shadow: 0 4px 20px rgba(45, 74, 62, 0.4),
              0 0 0 0 rgba(196, 150, 31, 0.45);
          }
          50% {
            box-shadow: 0 4px 20px rgba(45, 74, 62, 0.4),
              0 0 0 10px rgba(196, 150, 31, 0);
          }
        }
      `}</style>

      {/* ── Chat Window ── */}
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
              background:
                "linear-gradient(135deg, var(--green-deep), var(--green-mid))",
              borderColor: "var(--gold-mid)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            }}
          >
            <div className="flex items-center gap-3">
              <FredAvatar size="lg" />
              <div>
                <p className="font-['Playfair_Display'] font-bold text-amber-100 text-sm">
                  Frederick
                </p>
                <p
                  className="text-xs font-['Lora'] italic transition-colors duration-500"
                  style={{ color: statusColor }}
                >
                  {statusText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Voice toggle */}
              <button
                onClick={toggleVoice}
                title={voiceEnabled ? "Mute Frederick" : "Unmute Frederick"}
                className="text-amber-200 hover:text-amber-100 transition-colors"
                style={{ fontSize: "18px", lineHeight: 1 }}
              >
                {voiceEnabled ? "🔊" : "🔇"}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  stop();
                  setIsOpen(false);
                }}
                className="text-amber-200 hover:text-amber-100 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } max-w-[80%]`}
                >
                  <div
                    className={`rounded-xl px-4 py-2.5 ${
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

                  {msg.role === "assistant" && (
                    <SpeakerButton content={msg.content} index={i} />
                  )}
                </div>
              </div>
            ))}

            {/* Thinking dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <div className="flex gap-1 items-center">
                    <div
                      className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
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
                placeholder="Ask Frederick anything…"
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
