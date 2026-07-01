const avatarGradients = [
  "from-zinc-950 via-zinc-700 to-zinc-500",
  "from-neutral-800 via-neutral-600 to-neutral-400",
  "from-stone-800 via-stone-600 to-stone-400",
  "from-black via-zinc-800 to-zinc-500",
  "from-slate-900 via-slate-700 to-slate-500",
];

function getApiOrigin() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return new URL(import.meta.env.VITE_API_BASE_URL).origin;
  }

  if (
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return window.location.origin;
}

export function getInitials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function stringHash(value) {
  return [...value].reduce(
    (hash, character) => hash + character.charCodeAt(0),
    0,
  );
}

export function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatMessageTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isImageLikeUrl(value = "") {
  return /^https?:\/\/\S+\.(gif|png|jpe?g|webp)(\?\S*)?$/i.test(value.trim());
}

function resolveAttachmentUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, getApiOrigin()).toString();
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function getExtension(name = "", type = "") {
  const extension = name.split(".").pop();
  if (extension && extension !== name) return extension.toUpperCase();
  return type.split("/").pop()?.toUpperCase() || "FILE";
}

export function normalizeAttachment(attachment) {
  if (!attachment) return null;
  const category = attachment.category || attachment.type || "file";
  const name =
    attachment.name ||
    (category === "image"
      ? "Image"
      : category === "video"
        ? "Video"
        : "Attachment");
  return {
    category,
    type: category,
    mimeType: attachment.type || attachment.mime_type || "",
    name,
    size: attachment.size || 0,
    formattedSize: formatFileSize(attachment.size || 0),
    extension: getExtension(
      name,
      attachment.type || attachment.mime_type || "",
    ),
    url: resolveAttachmentUrl(attachment.url),
  };
}

export function createMessageAttachment(content = "") {
  const trimmedContent = content.trim();
  if (!isImageLikeUrl(trimmedContent)) return null;

  const isGif =
    /\.gif(\?\S*)?$/i.test(trimmedContent) ||
    /giphy|tenor/i.test(trimmedContent);

  return {
    type: "image",
    category: "image",
    mimeType: isGif ? "image/gif" : "image/*",
    name: isGif ? "GIF" : "Image",
    size: 0,
    formattedSize: "",
    extension: isGif ? "GIF" : "IMG",
    url: trimmedContent,
  };
}

export function getMessagePreview(content = "") {
  const attachment = createMessageAttachment(content);
  if (!attachment) return content;
  return attachment.name;
}

export function formatLastSeen(value) {
  if (!value) return "Last seen recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last seen recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Last seen just now";
  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last seen yesterday at ${formatMessageTime(date)}`;
  }

  return `Last seen ${date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })}`;
}

export function mapConversation(conversation) {
  const username = conversation.username || "Unknown user";
  const isOnline = Boolean(conversation.is_online);
  return {
    id: conversation.id,
    userId: conversation.user_id,
    username,
    initials: getInitials(username),
    avatarGradient:
      avatarGradients[stringHash(username) % avatarGradients.length],
    lastMessage: conversation.last_message
      ? getMessagePreview(conversation.last_message)
      : "Start a conversation",
    timestamp: formatConversationTime(conversation.timestamp),
    unreadCount: conversation.unread_count || 0,
    online: isOnline,
    lastSeen: conversation.last_seen || null,
    status: isOnline ? "Online" : formatLastSeen(conversation.last_seen),
  };
}

export function mapMessage(message, currentUsername) {
  const serverAttachment = normalizeAttachment(message.attachment);
  const urlAttachment = serverAttachment
    ? null
    : createMessageAttachment(message.content);
  const attachment = serverAttachment || urlAttachment;
  const content = urlAttachment ? "" : message.content || "";
  const previewText = content.trim()
    ? content
    : attachment
      ? attachment.name || attachment.category || "Attachment"
      : getMessagePreview(message.content);
  return {
    id: message.id,
    content,
    previewText,
    attachment,
    sender: message.sender === currentUsername ? "me" : "them",
    senderName: message.sender,
    timestamp: formatMessageTime(message.timestamp),
    status: message.is_read ? "Read" : "Delivered",
  };
}
