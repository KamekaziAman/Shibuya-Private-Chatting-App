import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../api/chatApi";
import { createNotificationsSocket } from "../services/socket";

const MAX_RECONNECT_DELAY = 10000;

export default function useNotificationsSocket({
  enabled = true,
  onConversationMessage,
  onPresence,
  onError,
}) {
  const callbacksRef = useRef({ onConversationMessage, onPresence, onError });
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState(enabled ? "connecting" : "idle");

  useEffect(() => {
    callbacksRef.current = { onConversationMessage, onPresence, onError };
  }, [onConversationMessage, onPresence, onError]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    let socket = null;

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
        socket = createNotificationsSocket();
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
      };

      socket.onmessage = (event) => {
        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
          callbacksRef.current.onError?.("The server returned an invalid notifications payload.");
          return;
        }

        if (payload.type === "conversation.message") {
          callbacksRef.current.onConversationMessage?.(payload);
        } else if (payload.type === "presence.update") {
          callbacksRef.current.onPresence?.(payload);
        }
      };

      socket.onerror = () => {
        if (!cancelled) setStatus("reconnecting");
      };

      socket.onclose = async (event) => {
        if (cancelled) return;
        socketRef.current = null;

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
      if (socket) {
        socket.onclose = null;
        socket.close(1000, "Notifications closed");
      }
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [enabled]);

  return { status: enabled ? status : "idle" };
}
