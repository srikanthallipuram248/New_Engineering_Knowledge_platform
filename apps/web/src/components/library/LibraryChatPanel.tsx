import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import VoiceButton from "../chat/VoiceButton";
import ThinkingLoader from "@/components/loaders/ThinkingLoader";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Sparkles,
  BrainCircuit,
  Loader2,
  AlertCircle,
  FileText,
  PlusCircle,
  History,
  Trash2,
  X as XIcon,
  ChevronDown,
  CheckSquare,
  Square,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion-presets";

//import { askChat, getChatHistory, regenerateChat, createChatSession } from '@/services/api'
// importing for streaming chat
import {
  askChat,
  getChatHistory,
  regenerateChat,
  createChatSession,
} from "@/services/api";

import type {
  ChatApiResponse,
  ChatHistoryMessage,
  ChatSource,
} from "@/services/api";

import {
  type ChatSession,
  type SessionMessage,
  loadSessions,
  saveSession,
  deleteSession,
  createNewSession,
  deriveTitleFromMessages,
  getActiveSessionId,
  setActiveSessionId,
  clearActiveSessionId,
} from "./ChatSessionManager";
import { ChatWelcomeScreen, FreshSessionPrompts } from "./ChatWelcomeScreen";

// Re-export SessionMessage as ChatMessage for internal use
type ChatMessage = SessionMessage;

interface LibraryChatPanelProps {
  /** Number of documents in the library — shown as context. */
  docCount: number;
  /** All docs available: names + ids for context scoping. */
  docNames?: string[];
  docs?: Array<{ id: number; file_name: string }>;
  /** Highlight a file in the library when a source is clicked. */
  onSourceClick?: (documentId: number) => void;
  newlyUploadedCount?: number;
  onAcknowledgeNewUploads?: () => void;
  onClearDocs?: () => Promise<void>;
  /** Activate this session id (e.g. one just created from outside, like
   *  "Ask about this repo" on the Analyzer page) as soon as it appears. */
  pendingFocusSessionId?: string | null;
}

type NewChatDialog = null | "choosing"; // null = no dialog, 'choosing' = showing keep/clear dialog

/**
 * Chat panel embedded in the Library page.
 *
 * Session management is client-side (localStorage). The backend's
 * /chat/history is loaded once on mount and stored as an initial session.
 */
export function LibraryChatPanel({
  docCount,
  docNames = [],
  docs = [],
  onSourceClick,
  newlyUploadedCount = 0,
  onAcknowledgeNewUploads,
  onClearDocs,
  pendingFocusSessionId,
}: LibraryChatPanelProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(
    () => getActiveSessionId(),
  );
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newChatDialog, setNewChatDialog] = useState<NewChatDialog>(null);
  const [newUploadsBanner, setNewUploadsBanner] = useState(false);
  // File context selector open/closed
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];
  const showWelcome = !activeSession;

  // Selected doc IDs for this session (empty = all docs)
  const selectedDocIds = activeSession?.selectedDocIds ?? [];

  //   const {
  //     transcript,
  //     isListening,
  //     isSupported,
  //     startListening,
  //     stopListening,
  // } = useSpeechRecognition((text) => {
  //     setDraft(text);

  //     if (text.trim()) {
  //         sendMessage(text);
  //     }
  // });
  const {
  transcript,
  isListening,
  isSupported,
  startListening,
  stopListening,
} = useSpeechRecognition((text) => {
  setDraft(text);
});

useEffect(() => {
  if (!isListening && transcript.trim()) {
    sendMessage(transcript);
  }
}, [isListening, transcript]);

  // // ── Load server history once on mount ──────────────────────────────────
  // useEffect(() => {
  //   let cancelled = false
  //   ;(async () => {
  //     try {
  //       //const history = await getChatHistory()
  //       if (!activeSession) return

  //         const history = await getChatHistory(
  //           activeSession.session_uuid
  //         )

  //       if (cancelled) return
  //       if (history.length > 0) {
  //         const existingSessions = loadSessions()
  //         const alreadyImported = existingSessions.some((s) => s.id === 'server-history')
  //         if (!alreadyImported) {
  //           const mapped: ChatMessage[] = history.map((h: ChatHistoryMessage) => ({
  //             id: `srv-${h.id}`,
  //             role: h.role,
  //             content: h.content,
  //           }))
  //           const serverSession: ChatSession = {
  //             id: 'server-history',
  //             title: 'Previous conversation',
  //             createdAt: history[0]?.created_at ?? new Date().toISOString(),
  //             updatedAt: history[history.length - 1]?.created_at ?? new Date().toISOString(),
  //             messages: mapped,
  //             docSnapshot: [],
  //             selectedDocIds: [],
  //           }
  //           saveSession(serverSession)
  //           setSessions(loadSessions())
  //         }
  //       }
  //     } catch {
  //       // silently start fresh
  //     } finally {
  //       if (!cancelled) setHistoryLoaded(true)
  //     }
  //   })()
  //   return () => { cancelled = true }
  // }, [])

  // Chat history is now loaded from the session APIs.
  // No initial history import is required.
  useEffect(() => {
    setHistoryLoaded(true);
  }, []);

  // ── Pick up sessions created outside this panel (e.g. "Ask about this
  // repo" on the Analyzer page, which saves a session directly to storage
  // before navigating here) ───────────────────────────────────────────────
  useEffect(() => {
    if (!pendingFocusSessionId) return;
    setActiveSessionId(pendingFocusSessionId);
    setActiveSessionIdState(pendingFocusSessionId);
    setSessions(loadSessions());
    setConfirmDelete(false);
  }, [pendingFocusSessionId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── New-uploads banner ────────────────────────────────────────────────
  useEffect(() => {
    if (newlyUploadedCount > 0) setNewUploadsBanner(true);
  }, [newlyUploadedCount]);

  // ── Session helpers ───────────────────────────────────────────────────

  function refreshSessions() {
    setSessions(loadSessions());
  }

  function activateSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setActiveSessionIdState(sessionId);
    setSessions(loadSessions());
    setConfirmDelete(false);
  }

  /** Show the choosing dialog if there are files in the library, else open new session immediately. */
  async function requestNewChat() {
    if (activeSession && activeSession.messages.length === 0) {
      return;
    }
    if (docCount === 0) {
      await startNewChat([]);
      return;
    }
    setNewChatDialog("choosing");
  }

  async function handleClearAndStartNew() {
    setNewChatDialog(null);
    if (onClearDocs) {
      await onClearDocs();
    }
    await startNewChat([]);
  }

  /** Create & activate a new session. Pass selectedDocIds to scope context. */
  async function startNewChat(newSelectedDocIds: number[]) {
    if (activeSession) saveSession(activeSession);

    // If there is already an empty session, reuse it instead of creating a duplicate
    const existingEmpty = sessions.find((s) => s.messages.length === 0);
    if (existingEmpty) {
      const updated = {
        ...existingEmpty,
        selectedDocIds: newSelectedDocIds,
        docSnapshot: docNames,
        updatedAt: new Date().toISOString(),
      };
      saveSession(updated);
      setActiveSessionId(existingEmpty.id);
      setActiveSessionIdState(existingEmpty.id);
      setDraft("");
      setConfirmDelete(false);
      setNewChatDialog(null);
      setFilePickerOpen(false);
      onAcknowledgeNewUploads?.();
      setSessions(loadSessions());
      return;
    }

    // const newSession = createNewSession(docNames, newSelectedDocIds)
    //   saveSession(newSession)
    //   setActiveSessionId(newSession.id)
    //   setActiveSessionIdState(newSession.id)

    const backendSession = await createChatSession("New Chat");

    const newSession = createNewSession(
      backendSession.session_uuid,
      docNames,
      newSelectedDocIds,
    );

    saveSession(newSession);
    setActiveSessionId(newSession.id);
    setActiveSessionIdState(newSession.id);
    setDraft("");
    setConfirmDelete(false);
    setNewChatDialog(null);
    setFilePickerOpen(false);
    onAcknowledgeNewUploads?.();
    setSessions(loadSessions());
  }

  function handleResumeSession(session: ChatSession) {
    activateSession(session.id);
    setDraft("");
  }

  function handleDeleteSession(sessionId: string) {
    deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      clearActiveSessionId();
      setActiveSessionIdState(null);
    }
    refreshSessions();
  }

  function handleDeleteActiveChat() {
    if (!activeSession) return;
    deleteSession(activeSession.id);
    clearActiveSessionId();
    setActiveSessionIdState(null);
    setConfirmDelete(false);
    refreshSessions();
  }

  /** Toggle a doc's inclusion in this session's context. */
  function toggleDocSelection(docId: number) {
    if (!activeSession) return;
    const current = activeSession.selectedDocIds;
    const next = current.includes(docId)
      ? current.filter((id) => id !== docId)
      : [...current, docId];
    const updated: ChatSession = {
      ...activeSession,
      selectedDocIds: next,
    };
    saveSession(updated);
    setSessions(loadSessions());
  }

  function selectAllDocs() {
    if (!activeSession) return;
    const updated: ChatSession = { ...activeSession, selectedDocIds: [] };
    saveSession(updated);
    setSessions(loadSessions());
  }

  // ── Regenerate message ────────────────────────────────────────────────

  async function regenerateMessage(assistantMsgId: string) {
    const currentSession = activeSession;
    if (!currentSession || sending) return;

    // Find the user question that preceded this assistant message
    const idx = currentSession.messages.findIndex(
      (m) => m.id === assistantMsgId,
    );
    const userMsg =
      idx > 0
        ? currentSession.messages
            .slice(0, idx)
            .reverse()
            .find((m) => m.role === "user")
        : null;
    if (!userMsg) return;

    const docIdsToSend =
      currentSession.selectedDocIds.length > 0
        ? currentSession.selectedDocIds
        : undefined;

    // Replace the assistant message with a pending state
    const withPending = currentSession.messages.map((m) =>
      m.id === assistantMsgId
        ? {
            ...m,
            pending: true,
            content: "",
            sources: undefined,
            failed: false,
          }
        : m,
    );
    saveSession({
      ...currentSession,
      messages: withPending,
      updatedAt: new Date().toISOString(),
    });
    setSessions(loadSessions());
    setSending(true);

    try {
      //const res: ChatApiResponse = await regenerateChat(userMsg.content, docIdsToSend)
      const res: ChatApiResponse = await regenerateChat(
        userMsg.content,
        currentSession.session_uuid,
        docIdsToSend,
      );
      const withResponse = withPending.map((m) =>
        m.id === assistantMsgId
          ? {
              ...m,
              pending: false,
              content: res.answer,
              sources: res.sources,
              answer_source: res.answer_source,
            }
          : m,
      );
      saveSession({
        ...currentSession,
        messages: withResponse,
        updatedAt: new Date().toISOString(),
      });
      setSessions(loadSessions());
    } catch (err: unknown) {
      const withError = withPending.map((m) =>
        m.id === assistantMsgId
          ? {
              ...m,
              pending: false,
              failed: true,
              content: err instanceof Error ? err.message : "Request failed",
            }
          : m,
      );
      saveSession({
        ...currentSession,
        messages: withError,
        updatedAt: new Date().toISOString(),
      });
      setSessions(loadSessions());
    } finally {
      setSending(false);
    }
  }

  // ── Send message ──────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    let currentSession = activeSession;
    // if (!currentSession) {
    //   currentSession = createNewSession(docNames, [])
    //   saveSession(currentSession)
    //   setActiveSessionId(currentSession.id)
    //   setActiveSessionIdState(currentSession.id)
    //   setSessions(loadSessions())
    // }
    if (!currentSession) {
      const backendSession = await createChatSession("New Chat");

      currentSession = createNewSession(
        backendSession.session_uuid,
        docNames,
        [],
      );

      saveSession(currentSession);

      setActiveSessionId(currentSession.id);
      setActiveSessionIdState(currentSession.id);

      setSessions(loadSessions());
    }

    const docIdsToSend =
      currentSession.selectedDocIds.length > 0
        ? currentSession.selectedDocIds
        : undefined;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const pendingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      pending: true,
    };

    const withPending = [...currentSession.messages, userMsg, pendingMsg];
    const optimistic: ChatSession = {
      ...currentSession,
      messages: withPending,
      updatedAt: new Date().toISOString(),
      title: deriveTitleFromMessages([...currentSession.messages, userMsg]),
    };
    saveSession(optimistic);
    setSessions(loadSessions());
    setDraft("");
    setSending(true);

    try {
      const res: ChatApiResponse = await askChat(
        content,
        currentSession.session_uuid,
        docIdsToSend,
      );

      const finalMessages = withPending.map((msg) =>
        msg.id === pendingMsg.id
          ? {
              ...pendingMsg,
              pending: false,
              content: res.answer,
              sources: res.sources,
              answer_source: res.answer_source,
            }
          : msg,
      );

      saveSession({
        ...optimistic,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      });

      setSessions(loadSessions());
    } catch (err: unknown) {
      const withError = withPending.map((msg) =>
        msg.id === pendingMsg.id
          ? {
              ...msg,
              pending: false,
              failed: true,
              content: err instanceof Error ? err.message : "Request failed",
            }
          : msg,
      );

      saveSession({
        ...optimistic,
        messages: withError,
        updatedAt: new Date().toISOString(),
      });

      setSessions(loadSessions());
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(draft);
  }

  // ── Context label for the header ──────────────────────────────────────
  const contextLabel =
    selectedDocIds.length === 0
      ? `All ${docCount} ${docCount === 1 ? "doc" : "docs"}`
      : `${selectedDocIds.length} of ${docCount} ${docCount === 1 ? "doc" : "docs"}`;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="glass-flat relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-foreground/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20">
            <BrainCircuit className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {activeSession ? activeSession.title : "Chat with your library"}
            </p>
            <div className="flex items-center gap-2">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Agent 2
              </p>
              {/* File context picker button */}
              {activeSession && docCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilePickerOpen((o) => !o)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 transition-all",
                    selectedDocIds.length > 0 &&
                      selectedDocIds.length < docCount
                      ? "bg-primary/15 text-primary ring-primary/30 hover:bg-primary/20"
                      : "bg-foreground/[0.05] text-muted-foreground ring-foreground/10 hover:bg-foreground/[0.08] hover:text-foreground",
                  )}
                >
                  <FileText className="h-2.5 w-2.5" />
                  {contextLabel}
                  <ChevronDown
                    className={cn(
                      "h-2.5 w-2.5 transition-transform",
                      filePickerOpen && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Chat history — go to full page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/chats")}
            aria-label="View chat history"
            className="h-8 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
          </Button>

          {activeSession && !confirmDelete && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={requestNewChat}
                disabled={messages.length === 0}
                aria-label="Start a new chat"
                className="h-8 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  messages.length === 0
                    ? "Current chat is already empty"
                    : "Start a new thread"
                }
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete this chat"
                className="h-8 gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive"
                title="Delete this chat session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {activeSession && confirmDelete && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Delete?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="h-7 text-[11px] text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteActiveChat}
                className="h-7 gap-1 text-[11px] text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* File context picker dropdown */}
      <AnimatePresence>
        {filePickerOpen && activeSession && docs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-b border-foreground/[0.06]"
          >
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Context files
                </p>
                <button
                  type="button"
                  onClick={selectAllDocs}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  {selectedDocIds.length === 0 ? "All selected" : "Select all"}
                </button>
              </div>
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {docs.map((doc) => {
                  const isSelected =
                    selectedDocIds.length === 0 ||
                    selectedDocIds.includes(doc.id);
                  const isExplicitlySelected = selectedDocIds.includes(doc.id);
                  return (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => toggleDocSelection(doc.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                          isSelected
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-foreground/5",
                        )}
                      >
                        {selectedDocIds.length === 0 ? (
                          <Check className="h-3 w-3 shrink-0 text-primary" />
                        ) : isExplicitlySelected ? (
                          <CheckSquare className="h-3 w-3 shrink-0 text-primary" />
                        ) : (
                          <Square className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        )}
                        <FileText className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{doc.file_name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selectedDocIds.length > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground/60">
                  Agent 2 will only search the {selectedDocIds.length} selected{" "}
                  {selectedDocIds.length === 1 ? "document" : "documents"}.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New-uploads banner */}
      <AnimatePresence>
        {newUploadsBanner && newlyUploadedCount > 0 && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-foreground/[0.06]"
          >
            <div className="flex items-center gap-3 bg-primary/[0.06] px-5 py-2.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="flex-1 text-foreground/80">
                {newlyUploadedCount === 1
                  ? "1 new document uploaded."
                  : `${newlyUploadedCount} new documents uploaded.`}{" "}
                Start a fresh thread?
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={requestNewChat}
                className="h-7 text-[11px] font-semibold text-primary hover:bg-primary/10"
              >
                Start
              </Button>
              <button
                type="button"
                onClick={() => {
                  setNewUploadsBanner(false);
                  onAcknowledgeNewUploads?.();
                }}
                aria-label="Dismiss"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat dialog — keep or clear files */}
      <AnimatePresence>
        {newChatDialog === "choosing" && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm"
              onClick={() => setNewChatDialog(null)}
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="glass-strong absolute inset-x-4 top-1/2 z-30 -translate-y-1/2 rounded-2xl p-5 shadow-2xl ring-1 ring-foreground/10"
            >
              <button
                type="button"
                onClick={() => setNewChatDialog(null)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
                  <PlusCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Starting a new chat
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    What files should this chat use?
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    startNewChat(activeSession?.selectedDocIds ?? [])
                  }
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-3.5 text-left",
                    "hover:border-primary/30 hover:bg-primary/[0.04] transition-all",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Retain files
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {selectedDocIds.length === 0
                        ? `Keep all ${docCount} documents in your library`
                        : `Keep current selection of ${selectedDocIds.length} of ${docCount} documents`}
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleClearAndStartNew}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] p-3.5 text-left",
                    "hover:border-destructive/30 hover:bg-destructive/[0.04] transition-all",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 ring-1 ring-destructive/20 group-hover:bg-destructive/20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Delete files
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Remove all {docCount}{" "}
                      {docCount === 1 ? "document" : "documents"} from the
                      library and start fresh
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setNewChatDialog(null)}
                className="mt-3 w-full rounded-xl py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {showWelcome ? (
          !historyLoaded ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChatWelcomeScreen
              sessions={sessions}
              onNewChat={requestNewChat}
              onResumeSession={handleResumeSession}
              onDeleteSession={handleDeleteSession}
            />
          )
        ) : (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                !historyLoaded ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <FreshSessionPrompts onPick={sendMessage} />
                )
              ) : (
                <ul className="space-y-4">
                  {messages.map((m) => (
                    <li key={m.id}>
                      <MessageBubble
                        message={m}
                        onSourceClick={onSourceClick}
                        onRegenerate={
                          m.role === "assistant" && !m.pending
                            ? () => regenerateMessage(m.id)
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-foreground/[0.06] p-3"
            >
              <div className="glass flex items-end gap-2 rounded-2xl p-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as FormEvent);
                    }
                  }}
                  rows={1}
                  placeholder={
                    selectedDocIds.length > 0
                      ? `Ask your ${selectedDocIds.length} selected ${selectedDocIds.length === 1 ? "document" : "documents"}…`
                      : "Ask anything…"
                  }
                  disabled={sending}
                  className={cn(
                    "max-h-32 min-h-[40px] flex-1 resize-none rounded-xl bg-transparent px-3 py-2 text-sm text-foreground",
                    "placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50",
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                  className="h-9 w-9 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>

                <VoiceButton
                  isListening={isListening}
                  isSupported={isSupported}
                  onStart={startListening}
                  onStop={stopListening}
                />
              </div>
              {isListening && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Listening...
                </div>
              )}
              <p className="mt-1.5 px-2 text-[10px] text-muted-foreground/70">
                <kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">
                  Enter
                </kbd>{" "}
                to send ·{" "}
                <kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">
                  Shift
                </kbd>
                +
                <kbd className="rounded border border-foreground/10 bg-foreground/5 px-1 font-mono text-[9px]">
                  Enter
                </kbd>{" "}
                for newline
                {selectedDocIds.length > 0 && (
                  <span className="ml-3 text-primary/80">
                    · searching {selectedDocIds.length}{" "}
                    {selectedDocIds.length === 1 ? "doc" : "docs"}
                  </span>
                )}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-foreground/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function MessageBubble({
  message,
  onSourceClick,
  onRegenerate,
}: {
  message: ChatMessage;
  onSourceClick?: (documentId: number) => void;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const isFailed = message.failed;
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  function handleThumbsDown() {
    setFeedback("down");
    onRegenerate?.();
  }

  function handleThumbsUp() {
    setFeedback("up");
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : isFailed
              ? "rounded-bl-md border border-destructive/30 bg-destructive/10 text-destructive"
              : "glass-flat rounded-bl-md text-foreground",
        )}
      >
        {message.pending ? (
          <>
            {message.content ? (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              <ThinkingLoader />
            )}
          </>
        ) : (
          <>
            {isFailed && (
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <AlertCircle className="h-3 w-3" />
                Failed
              </div>
            )}

            <p className="whitespace-pre-wrap break-words">{message.content}</p>

            {/* Answer Source */}

            {!isUser && (
              <div className="mt-2">
                {message.answer_source === "documents" ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                    📄 Answered from uploaded documents
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-100 px-4 py-1 text-xs text-blue-700">
                    🤖 AI Generated
                  </span>
                )}
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <SourceList
                sources={message.sources}
                onSourceClick={onSourceClick}
              />
            )}
          </>
        )}
      </div>

      {/* Thumbs feedback — only for non-pending, non-failed assistant messages */}
      {!isUser && !message.pending && !isFailed && onRegenerate && (
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={handleThumbsUp}
            title="Good response"
            className={cn(
              "rounded-md p-1 transition-colors",
              feedback === "up"
                ? "text-green-500"
                : "text-muted-foreground/40 hover:text-green-500",
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleThumbsDown}
            title="Regenerate response"
            className={cn(
              "rounded-md p-1 transition-colors",
              feedback === "down"
                ? "text-destructive"
                : "text-muted-foreground/40 hover:text-destructive",
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          {feedback === "up" && (
            <span className="text-[11px] text-green-500">Thanks!</span>
          )}
          {feedback === "down" && (
            <span className="text-[11px] text-muted-foreground">
              Regenerating…
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Source list & card ─────────────────────────────────────────────────────

function SourceList({
  sources,
  onSourceClick,
}: {
  sources: ChatSource[];
  onSourceClick?: (documentId: number) => void;
}) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-foreground/[0.08] pt-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <FileText className="h-3 w-3" />
        {sources.length} {sources.length === 1 ? "source" : "sources"}
      </p>
      <AnimatePresence initial={false}>
        {sources.map((s, i) => (
          <SourceCard
            key={`${s.document_id}-${i}`}
            source={s}
            index={i}
            onClick={() => onSourceClick?.(s.document_id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SourceCard({
  source,
  index,
  onClick,
}: {
  source: ChatSource;
  index: number;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="overflow-hidden rounded-lg border border-foreground/5 bg-foreground/[0.02] text-xs"
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/20">
            {index + 1}
          </span>
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-foreground/90">
            {source.filename}
          </span>
          {source.uploaded_by_name && (
            <span className="hidden shrink-0 text-[10px] text-muted-foreground/60 sm:inline">
              by {source.uploaded_by_name}
            </span>
          )}
        </button>
        {onClick && (
          <button
            type="button"
            onClick={onClick}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10"
            title="Highlight this document in the library"
          >
            Find
          </button>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="shrink-0 text-muted-foreground"
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </motion.span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-foreground/[0.06] px-2.5 py-2">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                {source.snippet}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                Document ID: {source.document_id}
                {source.uploaded_by != null &&
                  ` · uploader #${source.uploaded_by}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
