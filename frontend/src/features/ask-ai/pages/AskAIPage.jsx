import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import useChat from '../hooks/useChat';
import styles from './AskAI.module.css';

// ─── Suggestion prompts ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  { text: 'What are my top 3 AWS services by cost this month?', label: '💰 Cost breakdown' },
  { text: 'Are there any unusual spending spikes I should know about?', label: '⚠️ Anomaly detection' },
  { text: 'Which teams are closest to their monthly budget limits?', label: '📊 Budget analysis' },
  { text: 'How can I reduce my EC2 and RDS costs?', label: '✂️ Optimization tips' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Components ───────────────────────────────────────────────────────────────

/** Sidebar with chat history */
function ChatHistorySidebar({ chats, activeChatId, onSelect, onNew, onDelete, loading }) {
  return (
    <div className={styles.chatSidebar}>
      <div className={styles.chatSidebarHeader}>
        <p className={styles.chatSidebarTitle}>Chat History</p>
        <button className={styles.newChatBtn} onClick={onNew} id="new-chat-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <div className={styles.chatList}>
        {loading && chats.length === 0 ? (
          <div className={styles.chatListEmpty}>Loading…</div>
        ) : chats.length === 0 ? (
          <div className={styles.chatListEmpty}>
            No chats yet.<br />Start a new conversation above!
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`${styles.chatItem} ${activeChatId === chat._id ? styles.active : ''}`}
              onClick={() => onSelect(chat._id)}
              id={`chat-${chat._id}`}
            >
              <span className={styles.chatItemIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <div className={styles.chatItemText}>
                <div className={styles.chatItemTitle}>{chat.title || 'New Chat'}</div>
                <div className={styles.chatItemDate}>{fmtDate(chat.createdAt)}</div>
              </div>
              <button
                className={styles.chatItemDelete}
                onClick={(e) => { e.stopPropagation(); onDelete(chat._id); }}
                title="Delete"
                id={`del-${chat._id}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Single message bubble */
function MessageBubble({ message, userInitials }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.messageRow} ${isUser ? styles.user : styles.ai}`}>
      {/* Avatar */}
      <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.aiAvatar}`}>
        {isUser ? userInitials : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={styles.bubbleGroup}>
        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
          {isUser ? (
            message.content
          ) : (
            <div className={styles.aiMarkdown}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={styles.bubbleTime}>{fmt(message.createdAt)}</div>
      </div>
    </div>
  );
}

/** Animated typing indicator */
function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <div className={`${styles.avatar} ${styles.aiAvatar}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round" />
        </svg>
      </div>
      <div className={styles.typingBubble}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AskAIPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { user } = useSelector((s) => s.auth);
  const userInitials = (user?.name || 'U')
    .split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  const { chats, activeChatId, messages, sending, loading, error,
    fetchChats, selectChat, sendMessage, startNewChat, deleteChat } = useChat();

  // Load chats on mount
  useEffect(() => { fetchChats(); }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Auto-resize textarea
  const handleInput = (e) => {
    setInputValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  };

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || sending) return;
    const text = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
  }, [inputValue, sending, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const useSuggestion = (text) => { setInputValue(text); textareaRef.current?.focus(); };

  const activeChat = chats.find((c) => c._id === activeChatId);
  const hasMessages = messages.length > 0;

  return (
    <div className={styles.page}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header onMenuToggle={() => setMobileSidebarOpen(true)} />

        <div className={styles.chatLayout}>
          {/* ── History Panel ── */}
          <ChatHistorySidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelect={selectChat}
            onNew={startNewChat}
            onDelete={deleteChat}
            loading={loading}
          />

          {/* ── Main Chat ── */}
          <div className={styles.chatArea}>

            {/* Header bar */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.chatHeaderInfo}>
                <h2>{activeChat?.title || 'Cloudburn AI Assistant'}</h2>
                <p>Ask anything about your AWS costs & usage</p>
              </div>
              <div className={styles.ragBadge}>
                <span className={styles.ragDot} />
                RAG Enabled
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Messages area */}
            {loading && !hasMessages ? (
              <div className={styles.loadingMessages}>
                <div className={styles.spinner} /> Loading messages…
              </div>
            ) : !hasMessages ? (
              /* Welcome / empty state */
              <div className={styles.emptyState}>
                <div className={styles.emptyGlow}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7BA3F0" strokeWidth="1.5">
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className={styles.emptyTitle}>Ask Cloudburn AI</h2>
                <p className={styles.emptySubtitle}>
                  I have deep context of your AWS billing data. Ask me about costs, anomalies, budgets, or optimization opportunities.
                </p>
                <div className={styles.suggestionsGrid}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className={styles.suggestionCard} onClick={() => useSuggestion(s.text)} id={`sug-${i}`}>
                      <p>{s.text}</p>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messagesWrapper} id="messages-wrapper">
                {messages.map((msg) => (
                  <MessageBubble key={msg._id} message={msg} userInitials={userInitials} />
                ))}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            <div className={styles.inputArea}>
              <div className={styles.inputBox}>
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  className={styles.messageInput}
                  placeholder="Ask about your AWS costs, usage, or optimization…"
                  rows={1}
                  value={inputValue}
                  onChange={handleInput}
                  onKeyDown={handleKey}
                  disabled={sending}
                />
                <button
                  id="chat-send-btn"
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  title="Send (Enter)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                </button>
              </div>
              <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
