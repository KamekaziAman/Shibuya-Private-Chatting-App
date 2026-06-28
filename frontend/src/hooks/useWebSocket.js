import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../api/chatApi";
import { createChatSocket, socketPayloads } from "../services/socket";

const MAX_RECONNECT_DELAY = 10000;

export default function useWebSocket({
  conversationId,
  onMessage,
  onTyping,
  onPresence,
  onReadReceipt,
  onError,
}) {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pendingMessagesRef = useRef(new Map());
  const callbacksRef = useRef({ onMessage, onTyping, onPresence, onReadReceipt, onError });
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    callbacksRef.current = { onMessage, onTyping, onPresence, onReadReceipt, onError };
  }, [onMessage, onTyping, onPresence, onReadReceipt, onError]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    let cancelled = false;
    let socket = null;
    const pendingMessages = pendingMessagesRef.current;

    const scheduleReconnect = () => {
      if (cancelled) return;
      const attempt = reconnectAttemptsRef.current;
      const baseDelay = Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY);
      const delay = baseDelay + Math.round(Math.random() * 300);
      reconnectAttemptsRef.current += 1;
      setStatus("reconnecting");
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (cancelled) return;
      setStatus(reconnectAttemptsRef.current ? "reconnecting" : "connecting");

      try {
        socket = createChatSocket(conversationId);
      } catch (error) {
        setStatus("error");
        callbacksRef.current.onError?.(error.message);
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        reconnectAttemptsRef.current = 0;
        setStatus("open");

        pendingMessages.forEach((payload) => {
          socket.send(JSON.stringify(payload));
        });
      };

      socket.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          callbacksRef.current.onError?.("The server returned an invalid socket payload.");
          return;
        }

        if (payload.type === "message.new") {
          if (payload.client_id) pendingMessages.delete(payload.client_id);
          callbacksRef.current.onMessage?.(payload);
        } else if (payload.type === "typing.update") {
          callbacksRef.current.onTyping?.(payload);
        } else if (payload.type === "presence.update") {
          callbacksRef.current.onPresence?.(payload);
        } else if (payload.type === "messages.read") {
          callbacksRef.current.onReadReceipt?.(payload);
        } else if (payload.type === "error") {
          if (payload.client_id) pendingMessages.delete(payload.client_id);
          callbacksRef.current.onError?.(payload.message, payload.client_id);
        }
      };

      socket.onerror = () => {
        if (!cancelled) setStatus("reconnecting");
      };

      socket.onclose = async (event) => {
        if (cancelled) return;
        socketRef.current = null;

        if (event.code === 4403) {
          setStatus("forbidden");
          callbacksRef.current.onError?.("You no longer have access to this conversation.");
          return;
        }

        if (event.code === 4401) {
          try {
            await getCurrentUser();
          } catch {
            setStatus("error");
            return;
          }
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimerRef.current);
      reconnectAttemptsRef.current = 0;
      pendingMessages.clear();
      if (socket) {
        socket.onclose = null;
        socket.close(1000, "Conversation changed");
      }
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [conversationId]);

  const sendMessage = useCallback((content, clientId) => {
    const payload = socketPayloads.message(content, clientId);
    pendingMessagesRef.current.set(clientId, payload);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
    return true;
  }, []);

  const sendTyping = useCallback((isTyping) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(socketPayloads.typing(isTyping)));
    return true;
  }, []);

  const markRead = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(socketPayloads.read()));
    return true;
  }, []);

  return {
    status: conversationId ? status : "idle",
    sendMessage,
    sendTyping,
    markRead,
  };
}
