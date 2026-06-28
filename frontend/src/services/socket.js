import { tokenStorage } from "./tokenStorage";

function getWebSocketBaseUrl() {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL);
    const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${apiUrl.host}/ws/`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000/ws/`;
}

export function createChatSocket(conversationId) {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error("An access token is required to open the chat socket.");

  const baseUrl = getWebSocketBaseUrl();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(`chat/${conversationId}/`, normalizedBaseUrl);
  url.searchParams.set("token", token);
  return new WebSocket(url.toString());
}

export function createNotificationsSocket() {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error("An access token is required to open the notifications socket.");

  const baseUrl = getWebSocketBaseUrl();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("notifications/", normalizedBaseUrl);
  url.searchParams.set("token", token);
  return new WebSocket(url.toString());
}

export const socketPayloads = {
  message(content, clientId) {
    return { type: "message.send", content, client_id: clientId };
  },
  typing(isTyping) {
    return { type: isTyping ? "typing_start" : "typing_stop" };
  },
  read() {
    return { type: "message.read" };
  },
};
