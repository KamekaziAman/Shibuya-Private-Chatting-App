import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  GitBranch,
  Globe,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
  clearConversation,
  createOrOpenConversation,
  fetchMessages,
  getConversations,
  searchUsers,
  uploadMessageAttachment,
} from "../api/chatApi";
import { getApiErrorMessage } from "../api/axios";
import useAuth from "../hooks/useAuth";
import useDebounce from "../hooks/useDebounce";
import useNotificationsSocket from "../hooks/useNotificationsSocket";
import useWebSocket from "../hooks/useWebSocket";
import {
  createMessageAttachment,
  formatLastSeen,
  formatMessageTime,
  getMessagePreview,
  mapConversation,
  mapMessage,
} from "../services/chatMappers";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

function EmptyState() {
  const features = [
    {
      icon: LockKeyhole,
      title: "Private Messaging",
      description: "Focused one-to-one conversations without distractions.",
    },
    {
      icon: Search,
      title: "Fast User Search",
      description: "Find the right person and start talking in seconds.",
    },
    {
      icon: Zap,
      title: "Real-Time Chat",
      description: "Messages that feel immediate, fluid, and effortless.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Authentication",
      description: "Modern account protection built into every session.",
    },
  ];

  const socials = [
    { icon: GitBranch, label: "GitHub", href: "#" },
    { icon: BriefcaseBusiness, label: "LinkedIn", href: "#" },
    { icon: Globe, label: "Portfolio", href: "#" },
    { icon: Mail, label: "Email", href: "#" },
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <div className="chat-pattern relative h-full flex-1 overflow-y-auto">
      <div className="pointer-events-none absolute left-[12%] top-[8%] h-52 w-52 rounded-full bg-white/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[4%] right-[8%] h-64 w-64 rounded-full bg-zinc-300/25 blur-3xl" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 py-10 lg:px-10"
      >
        <motion.section variants={item} className="text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Welcome to
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.055em] text-zinc-950 sm:text-5xl">
            Shibuya
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium leading-6 text-zinc-700 sm:text-base">
            Connect instantly with people through secure one-to-one conversations.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
            A calm, thoughtfully designed messaging space for finding people, sharing ideas,
            and keeping meaningful conversations moving.
          </p>
        </motion.section>

        <motion.section
          variants={container}
          className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.article
              key={title}
              variants={item}
              whileHover={{ y: -5, scale: 1.015 }}
              className="group rounded-[20px] border border-white/90 bg-white/58 p-4 text-left shadow-[0_8px_24px_rgba(24,24,27,0.06)] backdrop-blur-xl transition-shadow hover:shadow-[0_14px_32px_rgba(24,24,27,0.11)]"
            >
              <span className="mb-3 grid h-9 w-9 place-items-center rounded-[12px] bg-zinc-900 text-white transition-transform group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-[12px] font-bold text-zinc-800">{title}</h3>
              <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">{description}</p>
            </motion.article>
          ))}
        </motion.section>

        <motion.section
          variants={item}
          className="mx-auto mt-6 flex w-full max-w-3xl flex-col items-center justify-between gap-4 rounded-[22px] border border-white/90 bg-white/55 p-4 shadow-[0_10px_30px_rgba(24,24,27,0.07)] backdrop-blur-xl sm:flex-row sm:p-5"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-zinc-700 to-black text-xs font-bold text-white shadow-md">
              AR
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Aman Rai</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Full Stack Developer</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {socials.map(({ icon: Icon, label, href }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                whileHover={{ y: -3, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="group flex h-9 items-center gap-2 rounded-[12px] border border-zinc-200/80 bg-white/75 px-3 text-[10px] font-semibold text-zinc-600 shadow-sm transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{label}</span>
                <ArrowUpRight className="h-3 w-3 opacity-45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </motion.a>
            ))}
          </div>
        </motion.section>

        <motion.p variants={item} className="mt-5 text-center text-[10px] text-zinc-400">
          Select a conversation from the sidebar to start messaging.
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const [conversationList, setConversationList] = useState([]);
  const [messagesMap, setMessagesMap] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [inboxToast, setInboxToast] = useState(null);
  const [actionToast, setActionToast] = useState(null);
  const [clearingConversation, setClearingConversation] = useState(false);
  const [draggingAttachment, setDraggingAttachment] = useState(false);
  const [droppedAttachment, setDroppedAttachment] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messageRequestRef = useRef(0);
  const typingTimersRef = useRef(new Map());
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);

  const activeConversation = useMemo(
    () => conversationList.find(({ id }) => id === activeConversationId) ?? null,
    [conversationList, activeConversationId],
  );

  const activeMessages = messagesMap[activeConversationId] ?? [];

  const handleSocketMessage = useCallback(
    ({ message, client_id: clientId }) => {
      const normalizedMessage = mapMessage(message, user.username);
      const conversationId = activeConversationId;
      if (!conversationId) return;

      setMessagesMap((current) => {
        const existingMessages = current[conversationId] ?? [];
        const alreadyExists = existingMessages.some(({ id }) => id === normalizedMessage.id);
        if (alreadyExists) return current;

        const optimisticIndex = clientId
          ? existingMessages.findIndex(({ id }) => id === clientId)
          : -1;
        const nextMessages = [...existingMessages];
        if (optimisticIndex >= 0) nextMessages[optimisticIndex] = normalizedMessage;
        else nextMessages.push(normalizedMessage);
        return { ...current, [conversationId]: nextMessages };
      });

      setConversationList((items) => {
        const updated = items.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                lastMessage: normalizedMessage.previewText,
                timestamp: normalizedMessage.timestamp,
                unreadCount: 0,
              }
            : item,
        );
        const selected = updated.find(({ id }) => id === conversationId);
        return selected
          ? [selected, ...updated.filter(({ id }) => id !== conversationId)]
          : updated;
      });
      setTypingUsers((users) => users.filter((username) => username !== message.sender));
    },
    [activeConversationId, user.username],
  );

  const handleInboxMessage = useCallback(
    ({ conversation, message }) => {
      const conversationId = conversation.id;
      const normalizedConversation = mapConversation(conversation);
      const normalizedMessage = mapMessage(message, user.username);
      const isActiveConversation = conversationId === activeConversationId;

      setConversationList((items) => {
        const conversationExists = items.some(({ id }) => id === conversationId);
        const updated = conversationExists
          ? items.map((item) =>
              item.id === conversationId
                ? {
                    ...item,
                    ...normalizedConversation,
                    online: item.online,
                    status: item.status,
                    unreadCount: isActiveConversation ? 0 : normalizedConversation.unreadCount,
                  }
                : item,
            )
          : [
              {
                ...normalizedConversation,
                unreadCount: isActiveConversation ? 0 : normalizedConversation.unreadCount,
              },
              ...items,
            ];

        const selected = updated.find(({ id }) => id === conversationId);
        return selected
          ? [selected, ...updated.filter(({ id }) => id !== conversationId)]
          : updated;
      });

      if (!isActiveConversation && message.sender !== user.username) {
        setInboxToast({
          id: `${conversationId}-${message.id}`,
          username: normalizedConversation.username,
          content: normalizedMessage.previewText,
        });
      }

      if (!isActiveConversation) return;

      setMessagesMap((current) => {
        const existingMessages = current[conversationId] ?? [];
        const alreadyExists = existingMessages.some(({ id }) => id === normalizedMessage.id);
        if (alreadyExists) return current;

        const clientId = message.client_id;
        const optimisticIndex = clientId
          ? existingMessages.findIndex(({ id }) => id === clientId)
          : -1;
        const nextMessages = [...existingMessages];
        if (optimisticIndex >= 0) nextMessages[optimisticIndex] = normalizedMessage;
        else nextMessages.push(normalizedMessage);
        return { ...current, [conversationId]: nextMessages };
      });
      setTypingUsers((users) => users.filter((username) => username !== message.sender));
    },
    [activeConversationId, user.username],
  );

  const handleTypingUpdate = useCallback(
    ({ username, is_typing: isTyping }) => {
      if (username === user.username) return;

      window.clearTimeout(typingTimersRef.current.get(username));

      setTypingUsers((users) => {
        if (isTyping) return users.includes(username) ? users : [...users, username];
        return users.filter((item) => item !== username);
      });

      if (isTyping) {
        const timer = window.setTimeout(() => {
          setTypingUsers((users) => users.filter((item) => item !== username));
          typingTimersRef.current.delete(username);
        }, 1800);
        typingTimersRef.current.set(username, timer);
      } else {
        typingTimersRef.current.delete(username);
      }
    },
    [user.username],
  );

  const handlePresenceUpdate = useCallback(
    ({ user_id: userId, username, is_online: isOnline, status, last_seen: lastSeen }) => {
      if (username === user.username) return;
      const online = typeof isOnline === "boolean" ? isOnline : status === "online";
      setConversationList((items) =>
        items.map((item) =>
          item.userId === userId || item.username === username
            ? {
                ...item,
                online,
                lastSeen: lastSeen || item.lastSeen,
                status: online ? "Online" : formatLastSeen(lastSeen || item.lastSeen),
              }
            : item,
        ),
      );
    },
    [user.username],
  );

  const handleReadReceipt = useCallback(
    ({ username, message_ids: messageIds }) => {
      if (username === user.username || !activeConversationId) return;
      const readIds = new Set(messageIds);
      setMessagesMap((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] ?? []).map((message) =>
          message.sender === "me" && readIds.has(message.id)
            ? { ...message, status: "Read" }
            : message,
        ),
      }));
    },
    [activeConversationId, user.username],
  );

  const handleSocketError = useCallback(
    (message, clientId) => {
      setChatError(message);
      if (!clientId || !activeConversationId) return;
      setMessagesMap((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] ?? []).map((item) =>
          item.id === clientId ? { ...item, status: "Failed" } : item,
        ),
      }));
    },
    [activeConversationId],
  );

  const {
    status: socketStatus,
    sendMessage: sendSocketMessage,
    sendTyping,
    markRead,
  } = useWebSocket({
    conversationId: activeConversationId,
    onMessage: handleSocketMessage,
    onTyping: handleTypingUpdate,
    onPresence: handlePresenceUpdate,
    onReadReceipt: handleReadReceipt,
    onError: handleSocketError,
  });

  useNotificationsSocket({
    enabled: Boolean(user),
    onConversationMessage: handleInboxMessage,
    onPresence: handlePresenceUpdate,
    onError: setChatError,
  });

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError("");
    try {
      const data = await getConversations();
      const conversations = data.map(mapConversation);
      setConversationList(conversations);
      return conversations;
    } catch (error) {
      setConversationsError(getApiErrorMessage(error));
      return [];
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadConversations, 0);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  useEffect(() => {
    const refreshPresence = () => {
      if (document.visibilityState === "visible") {
        loadConversations();
      }
    };

    window.addEventListener("focus", refreshPresence);
    document.addEventListener("visibilitychange", refreshPresence);
    return () => {
      window.removeEventListener("focus", refreshPresence);
      document.removeEventListener("visibilitychange", refreshPresence);
    };
  }, [loadConversations]);

  useEffect(() => {
    let active = true;

    async function runSearch() {
      if (debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        setSearchingUsers(false);
        return;
      }

      setSearchingUsers(true);
      try {
        const results = await searchUsers(debouncedSearchQuery);
        if (active) setSearchResults(results);
      } catch (error) {
        if (active) {
          setSearchResults([]);
          setChatError(getApiErrorMessage(error));
        }
      } finally {
        if (active) setSearchingUsers(false);
      }
    }

    runSearch();
    return () => {
      active = false;
    };
  }, [debouncedSearchQuery]);

  const handleSelectConversation = async (id) => {
    const requestId = messageRequestRef.current + 1;
    messageRequestRef.current = requestId;
    setActiveConversationId(id);
    setMobileShowChat(true);
    setMessagesLoading(true);
    setChatError("");
    setTypingUsers([]);
    setMessagesMap((current) => ({ ...current, [id]: [] }));
    setConversationList((items) =>
      items.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
    );

    try {
      const data = await fetchMessages(id);
      const loadedMessages = data.map((message) => mapMessage(message, user.username));
      setMessagesMap((current) => {
        const messagesReceivedWhileLoading = current[id] ?? [];
        const loadedIds = new Set(loadedMessages.map(({ id: messageId }) => messageId));
        return {
          ...current,
          [id]: [
            ...loadedMessages,
            ...messagesReceivedWhileLoading.filter(({ id: messageId }) => !loadedIds.has(messageId)),
          ],
        };
      });
    } catch (error) {
      setChatError(getApiErrorMessage(error));
    } finally {
      if (messageRequestRef.current === requestId) setMessagesLoading(false);
    }
  };

  const handleStartConversation = async (person) => {
    setChatError("");
    try {
      const { conversation_id: conversationId } = await createOrOpenConversation(person.id);
      const conversations = await loadConversations();
      setSearchQuery("");
      setSearchResults([]);

      if (!conversations.some(({ id }) => id === conversationId)) {
        setConversationList((items) => [
          mapConversation({
            id: conversationId,
            user_id: person.id,
            username: person.username,
          }),
          ...items,
        ]);
      }
      await handleSelectConversation(conversationId);
    } catch (error) {
      setChatError(getApiErrorMessage(error));
    }
  };

  const handleSendMessage = (content) => {
    if (!activeConversationId) return;
    const conversationId = activeConversationId;
    const temporaryId = `pending-${Date.now()}`;
    const attachment = createMessageAttachment(content);
    const previewText = getMessagePreview(content);
    const optimisticMessage = {
      id: temporaryId,
      content: attachment ? "" : content,
      previewText,
      attachment,
      sender: "me",
      timestamp: formatMessageTime(new Date()),
      status: socketStatus === "open" ? "Sending" : "Queued",
    };

    setMessagesMap((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), optimisticMessage],
    }));
    setConversationList((items) => {
      const updated = items.map((item) =>
        item.id === conversationId
          ? { ...item, lastMessage: previewText, timestamp: formatMessageTime(new Date()) }
          : item,
      );
      const active = updated.find(({ id }) => id === conversationId);
      return active
        ? [active, ...updated.filter(({ id }) => id !== conversationId)]
        : updated;
    });

    sendSocketMessage(content, temporaryId);
  };

  const showActionToast = useCallback((message, type = "success", title) => {
    setActionToast({
      id: `${type}-${Date.now()}`,
      type,
      title: title || (type === "error" ? "Something went wrong" : "Success"),
      message,
    });
  }, []);

  const handleSendAttachment = async (file, content, onProgress) => {
    if (!activeConversationId) return;

    try {
      const message = await uploadMessageAttachment(activeConversationId, {
        file,
        content,
        onProgress,
      });
      const normalizedMessage = mapMessage(message, user.username);
      setMessagesMap((current) => {
        const existingMessages = current[activeConversationId] ?? [];
        if (existingMessages.some(({ id }) => id === normalizedMessage.id)) return current;
        return {
          ...current,
          [activeConversationId]: [...existingMessages, normalizedMessage],
        };
      });
      setConversationList((items) => {
        const updated = items.map((item) =>
          item.id === activeConversationId
            ? {
                ...item,
                lastMessage: normalizedMessage.previewText,
                timestamp: normalizedMessage.timestamp,
                unreadCount: 0,
              }
            : item,
        );
        const selected = updated.find(({ id }) => id === activeConversationId);
        return selected
          ? [selected, ...updated.filter(({ id }) => id !== activeConversationId)]
          : updated;
      });
      showActionToast("Attachment sent successfully.", "success", "Attachment uploaded");
    } catch (error) {
      const message = getApiErrorMessage(error);
      showActionToast(message, "error", "Upload failed");
      throw error;
    }
  };

  const handleClearConversation = async () => {
    if (!activeConversationId) return;
    const conversationId = activeConversationId;
    setClearingConversation(true);
    setChatError("");

    try {
      const response = await clearConversation(conversationId);

      setMessagesMap((current) => ({ ...current, [conversationId]: [] }));
      setConversationList((items) =>
        items.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                lastMessage: "Start a conversation",
                unreadCount: 0,
              }
            : item,
        ),
      );
      setTypingUsers([]);
      setActionToast({
        id: `clear-success-${Date.now()}`,
        type: "success",
        title: "Conversation cleared",
        message: response.message || "Conversation cleared successfully.",
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setActionToast({
        id: `clear-error-${Date.now()}`,
        type: "error",
        title: "Could not clear conversation",
        message,
      });
    } finally {
      setClearingConversation(false);
    }
  };

  useEffect(() => {
    if (socketStatus === "open" && activeConversationId) markRead();
  }, [socketStatus, activeConversationId, activeMessages.length, markRead]);

  useEffect(
    () => () => {
      typingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      typingTimersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!inboxToast) return undefined;
    const timer = window.setTimeout(() => setInboxToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [inboxToast]);

  useEffect(() => {
    if (!actionToast) return undefined;
    const timer = window.setTimeout(() => setActionToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [actionToast]);

  const handleDragEnter = (event) => {
    if (!activeConversationId) return;
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    setDraggingAttachment(true);
  };

  const handleDragOver = (event) => {
    if (!activeConversationId) return;
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    setDraggingAttachment(true);
  };

  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDraggingAttachment(false);
  };

  const handleDrop = (event) => {
    if (!activeConversationId) return;
    event.preventDefault();
    setDraggingAttachment(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      showActionToast("File size must be less than 5 MB.", "error", "Upload failed");
      return;
    }
    setDroppedAttachment(file);
  };

  return (
    <section className="relative z-10 flex h-dvh w-full overflow-hidden bg-white/55 backdrop-blur-2xl">
      <AnimatePresence>
        {actionToast && (
          <motion.button
            key={actionToast.id}
            type="button"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            onClick={() => setActionToast(null)}
            className={`absolute right-4 top-4 z-40 max-w-[calc(100%-2rem)] rounded-[18px] border-2 bg-white/92 px-4 py-3 text-left shadow-[0_18px_45px_rgba(24,24,27,0.18)] backdrop-blur-xl md:max-w-sm ${
              actionToast.type === "error" ? "border-red-500" : "border-zinc-950"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                actionToast.type === "error" ? "text-red-500" : "text-zinc-400"
              }`}
            >
              {actionToast.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs font-medium text-zinc-700">
              {actionToast.message}
            </p>
          </motion.button>
        )}
        {inboxToast && (
          <motion.button
            key={inboxToast.id}
            type="button"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            onClick={() => setInboxToast(null)}
            className={`absolute right-4 z-30 max-w-[calc(100%-2rem)] rounded-[18px] border-2 border-zinc-950 bg-white/90 px-4 py-3 text-left shadow-[0_18px_45px_rgba(24,24,27,0.18)] backdrop-blur-xl md:max-w-sm ${
              actionToast ? "top-24" : "top-4"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              New message
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-950">{inboxToast.username}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{inboxToast.content}</p>
          </motion.button>
        )}
      </AnimatePresence>
      <aside
        className={`${mobileShowChat ? "hidden md:flex" : "flex"} h-full w-full shrink-0 md:w-[340px]`}
      >
        <Sidebar
          conversations={conversationList}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          searchResults={searchResults}
          searchingUsers={searchingUsers}
          onStartConversation={handleStartConversation}
          conversationsLoading={conversationsLoading}
          conversationsError={conversationsError}
          onRetryConversations={loadConversations}
          currentUser={user}
          onLogout={logout}
        />
      </aside>

      <div
        className={`${mobileShowChat ? "flex" : "hidden md:flex"} h-full min-w-0 flex-1 flex-col bg-white/30`}
      >
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div
              key={activeConversation.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-full min-h-0 flex-1 flex-col"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <AnimatePresence>
                {draggingAttachment && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-x-3 bottom-24 top-24 z-40 grid place-items-center rounded-[28px] border-2 border-dashed border-[#7C3AED] bg-[#7C3AED]/12 text-center backdrop-blur-sm"
                  >
                    <div className="rounded-[22px] border border-white/20 bg-white/70 px-6 py-5 shadow-xl dark:bg-[#1E2430]/88">
                      <p className="text-sm font-bold text-zinc-950 dark:text-[#F3F4F6]">Drop to attach</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-[#9CA3AF]">Images, videos, PDFs, docs, archives up to 5 MB.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <ChatHeader
                conversation={activeConversation}
                connectionStatus={socketStatus}
                typingUsername={typingUsers[0]}
                onBack={() => setMobileShowChat(false)}
                onClearConversation={handleClearConversation}
                clearingConversation={clearingConversation}
              />
              <AnimatePresence>
                {chatError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="soft-divider flex items-center justify-between gap-3 border-b bg-zinc-100 px-5 py-2.5 text-xs font-medium text-zinc-700"
                  >
                    <span>{chatError}</span>
                    <button type="button" onClick={() => setChatError("")} className="font-bold text-zinc-950">
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <MessageList
                messages={activeMessages}
                loading={messagesLoading}
                typingUsername={typingUsers[0]}
              />
              <MessageInput
                onSend={handleSendMessage}
                onSendAttachment={handleSendAttachment}
                onTypingChange={sendTyping}
                incomingFile={droppedAttachment}
                onIncomingFileConsumed={() => setDroppedAttachment(null)}
                onToast={showActionToast}
              />
            </motion.div>
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
