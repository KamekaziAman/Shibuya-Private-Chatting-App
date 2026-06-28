import api from "./axios";

export async function loginUser(credentials) {
  const { data } = await api.post("accounts/login/", credentials);
  return data;
}

export async function registerUser(credentials) {
  const { data } = await api.post("accounts/register/", credentials);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("accounts/me/");
  return data;
}

export async function searchUsers(query) {
  const { data } = await api.get("accounts/users/search/", {
    params: { q: query },
  });
  return data;
}

export async function createOrOpenConversation(userId) {
  const { data } = await api.post("conversations/", { user_id: userId });
  return data;
}

export async function getConversations() {
  const { data } = await api.get("conversations/list/");
  return data;
}

export async function fetchMessages(conversationId) {
  const { data } = await api.get(`messages/${conversationId}/`);
  return data;
}

export async function sendMessage(conversationId, content) {
  const { data } = await api.post(`messages/${conversationId}/`, { content });
  return data;
}

export async function uploadMessageAttachment(conversationId, { file, content = "", onProgress }) {
  const formData = new FormData();
  formData.append("attachment_file", file);
  if (content.trim()) formData.append("content", content.trim());

  const { data } = await api.post(`messages/${conversationId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress(progressEvent) {
      if (!progressEvent.total || !onProgress) return;
      onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
    },
  });
  return data;
}

export async function clearConversation(conversationId) {
  const { data } = await api.delete(`conversations/${conversationId}/clear/`);
  return data;
}
