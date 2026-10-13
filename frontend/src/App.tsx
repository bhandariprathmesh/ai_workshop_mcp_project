import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface HealthStatus {
  status: string;
  database: string;
  database_name?: string;
  model?: string;
}

const SAMPLE_QUESTIONS = [
  "Which farmers have pending payments?",
  "What is the total pending payment?",
  "Which farmer supplied the most sugarcane?",
  "Show farmer payment details for Ramesh Shinde.",
  "How much sugarcane was supplied from Kopargaon?",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: "error", database: "unavailable" });
      }
    } catch {
      setHealth({ status: "error", database: "offline" });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get an answer from the server.");
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(
        err.message ||
          "Unable to reach the assistant server. Please check backend connection."
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const isDbConnected = health?.database === "connected";

  return (
    <div id="root">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-icon" aria-hidden="true">
            🌾
          </div>
          <div className="header-title-area">
            <h1>Sugarcane Farmer AI Assistant</h1>
            <p>Ask questions about farmer supplies, payments, and villages.</p>
          </div>
        </div>

        <div className="header-right">
          <div
            className="db-badge"
            title={
              health ? `Database: ${health.database}` : "Checking database..."
            }
          >
            <span
              className={`status-dot ${isDbConnected ? "" : "disconnected"}`}
            />
            <span>
              {isDbConnected
                ? "PostgreSQL Connected"
                : health?.database
                ? `DB: ${health.database}`
                : "Connecting DB..."}
            </span>
          </div>

          <button
            type="button"
            className="clear-btn"
            onClick={handleClearChat}
            disabled={messages.length === 0 && !error}
            title="Clear Chat History"
          >
            Clear Chat
          </button>
        </div>
      </header>

      <main className="chat-container">
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-container">
              <span className="welcome-badge">
                Sanjivani Sugar Factory • MCP Assistant
              </span>
              <h2 className="welcome-title">Welcome to the Farmer Portal</h2>
              <p className="welcome-desc">
                Ask any question about sugarcane supply tonnage, payment status,
                pending amounts, or farmer details from our real PostgreSQL
                records.
              </p>

              <div className="chips-section">
                <div className="chips-title">Sample Questions (Click to ask)</div>
                <div className="chips-grid">
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sample-chip"
                      onClick={() => handleSubmit(q)}
                      disabled={isLoading}
                    >
                      <span>{q}</span>
                      <span className="chip-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                <div className="avatar" aria-hidden="true">
                  {msg.role === "user" ? "👤" : "🌾"}
                </div>
                <div className="message-bubble">
                  {renderContent(msg.content)}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="loading-row">
              <div className="avatar" aria-hidden="true">
                🌾
              </div>
              <div className="loading-bubble">
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <span>Checking farmer records in database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form
            className="input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
          >
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question about sugarcane farmers (e.g., Which farmer supplied the most sugarcane?)..."
              disabled={isLoading}
              aria-label="Farmer query input"
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <span>Send</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <div className="input-hint">
            Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for
            a new line.
          </div>
        </div>
      </main>
    </div>
  );
}
