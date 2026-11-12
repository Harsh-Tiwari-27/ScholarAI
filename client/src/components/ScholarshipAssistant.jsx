import React, { useState, useRef, useEffect, useCallback } from "react";
import "./ScholarshipAssistant.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 10; // messages kept in context sent to Gemini
const MAX_QUESTION_LENGTH = 2000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const SUGGESTED_QUESTIONS = [
  "Which scholarships am I eligible for?",
  "Find scholarships based on my CGPA.",
  "Explain my eligibility for Merit Scholarship 2027.",
  "What scholarships have upcoming deadlines?",
  "How can I improve my scholarship eligibility?",
];

// Errors that should NOT be retried (client/auth errors)
const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 422]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for `ms` milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call POST /api/ai/ask and return the answer string.
 * Throws an object { message, retryable }.
 */
async function callAskEndpoint({ question, chatHistory, signal }) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw { message: "You are not logged in. Please log in again.", retryable: false };
  }

  let response;
  try {
    response = await fetch("/api/ai/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question, chatHistory }),
      signal,
    });
  } catch (networkErr) {
    if (networkErr.name === "AbortError") throw { message: "Request cancelled.", retryable: false };
    throw { message: "Network error. Please check your connection.", retryable: true };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const retryable = !NO_RETRY_STATUSES.has(response.status);
    const message =
      data.message ||
      (response.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : response.status === 503
        ? "The AI service is temporarily unavailable. Please try again shortly."
        : "Unable to get a response from the AI. Please try again.");
    throw { message, retryable };
  }

  return data.answer || "I couldn't generate an answer. Please try again.";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated typing indicator shown while Gemini is thinking */
function TypingIndicator() {
  return (
    <div className="sa-message sa-message--ai" aria-label="ScholarAI Assistant is thinking">
      <div className="sa-avatar sa-avatar--ai" aria-hidden="true">
        🤖
      </div>
      <div className="sa-bubble sa-bubble--ai sa-typing-indicator">
        <span className="sa-dot" />
        <span className="sa-dot" />
        <span className="sa-dot" />
      </div>
    </div>
  );
}

/** A single chat message bubble */
function ChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`sa-message ${isUser ? "sa-message--user" : "sa-message--ai"}`}
    >
      {!isUser && (
        <div className="sa-avatar sa-avatar--ai" aria-hidden="true">
          🤖
        </div>
      )}
      <div className={`sa-bubble ${isUser ? "sa-bubble--user" : "sa-bubble--ai"}`}>
        {message.text.split("\n").map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
        {message.error && (
          <span className="sa-bubble-error-tag" aria-label="Error message">
            {" "}⚠
          </span>
        )}
      </div>
      {isUser && (
        <div className="sa-avatar sa-avatar--user" aria-hidden="true">
          👤
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function ScholarshipAssistant() {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false); // guard against duplicate submissions

  // ---------------------------------------------------------------------------
  // Scroll to bottom on new messages
  // ---------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  // ---------------------------------------------------------------------------
  // Build the chat history payload (last MAX_HISTORY messages, user+ai only)
  // ---------------------------------------------------------------------------
  const buildChatHistory = useCallback((msgs) => {
    return msgs
      .filter((m) => !m.error) // exclude error messages from history
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
  }, []);

  // ---------------------------------------------------------------------------
  // Core send logic
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (questionText) => {
      const trimmed = questionText.trim();

      // Client-side validations
      if (!trimmed) {
        setErrorMessage("Please enter a question before sending.");
        return;
      }
      if (trimmed.length > MAX_QUESTION_LENGTH) {
        setErrorMessage(`Your question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`);
        return;
      }
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setErrorMessage("");
      setInputValue("");

      // Append user message
      const userMsg = { id: Date.now(), role: "user", text: trimmed };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        return updated;
      });

      setIsLoading(true);

      // Capture history snapshot before this message
      const historySnapshot = buildChatHistory(
        messages.filter((m) => !m.error)
      );

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let attempt = 0;
      let lastError = null;

      while (attempt <= MAX_RETRIES) {
        try {
          const answer = await callAskEndpoint({
            question: trimmed,
            chatHistory: historySnapshot,
            signal: controller.signal,
          });

          const aiMsg = {
            id: Date.now() + 1,
            role: "ai",
            text: answer,
          };

          setMessages((prev) => [...prev, aiMsg]);
          setIsLoading(false);
          isSubmittingRef.current = false;
          inputRef.current?.focus();
          return;
        } catch (err) {
          lastError = err;
          if (!err.retryable || attempt >= MAX_RETRIES) break;
          attempt++;
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }

      // All retries exhausted
      const errorMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: lastError?.message || "An unexpected error occurred. Please try again.",
        error: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);
      isSubmittingRef.current = false;
      inputRef.current?.focus();
    },
    [messages, buildChatHistory]
  );

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      sendMessage(inputValue);
    },
    [inputValue, sendMessage]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage]
  );

  const handleSuggestedQuestion = useCallback(
    (question) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  const handleClearChat = useCallback(() => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    isSubmittingRef.current = false;
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    setErrorMessage("");
    inputRef.current?.focus();
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const showSuggestedQuestions = messages.length === 0 && !isLoading;
  const canSend = !isLoading && inputValue.trim().length > 0;
  const charCount = inputValue.length;
  const charWarning = charCount > MAX_QUESTION_LENGTH * 0.9;

  return (
    <section className="sa-container" id="ai-assistant" aria-label="ScholarAI Assistant">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sa-header">
        <div className="sa-header-left">
          <div className="sa-header-icon" aria-hidden="true">🤖</div>
          <div>
            <h2 className="sa-title">ScholarAI Assistant</h2>
            <div className="sa-status">
              <span className="sa-status-dot" aria-hidden="true" />
              <span>AI Powered · Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sa-clear-btn"
          onClick={handleClearChat}
          disabled={messages.length === 0 && !isLoading}
          aria-label="Clear conversation"
        >
          🗑 Clear Chat
        </button>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      <div className="sa-chat-area" role="log" aria-live="polite" aria-label="Conversation">
        {/* Welcome screen with suggested questions */}
        {showSuggestedQuestions && (
          <div className="sa-welcome">
            <div className="sa-welcome-icon" aria-hidden="true">🎓</div>
            <h3 className="sa-welcome-title">How can I help you today?</h3>
            <p className="sa-welcome-subtitle">
              Ask me about scholarships, eligibility, deadlines, or application guidance
              personalised to your profile.
            </p>

            <div className="sa-suggestions" role="list" aria-label="Suggested questions">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="sa-suggestion-btn"
                  onClick={() => handleSuggestedQuestion(question)}
                  role="listitem"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="sa-error-banner" role="alert">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="sa-error-dismiss"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Input Area ─────────────────────────────────────────────────────── */}
      <form className="sa-input-area" onSubmit={handleSubmit} noValidate>
        <div className="sa-input-wrapper">
          <textarea
            ref={inputRef}
            className="sa-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scholarships, eligibility, deadlines…"
            rows={1}
            maxLength={MAX_QUESTION_LENGTH + 50} /* soft warn before hard limit */
            disabled={isLoading}
            aria-label="Your question"
            aria-describedby="sa-input-hint"
          />

          {/* Character counter (shown when approaching limit) */}
          {charWarning && (
            <span
              className={`sa-char-count ${charCount > MAX_QUESTION_LENGTH ? "sa-char-count--over" : ""}`}
              aria-live="polite"
            >
              {charCount}/{MAX_QUESTION_LENGTH}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="sa-send-btn"
          disabled={!canSend}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="sa-send-spinner" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">➤</span>
          )}
        </button>
      </form>

      <p className="sa-input-hint" id="sa-input-hint">
        Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line
      </p>
    </section>
  );
}

export default ScholarshipAssistant;

