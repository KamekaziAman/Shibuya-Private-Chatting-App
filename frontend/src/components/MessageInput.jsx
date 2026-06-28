import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Image, Mic, Paperclip, Send, Smile, Video, X } from "lucide-react";
import EmojiGifPopover from "./EmojiGifPopover";
import { formatFileSize } from "../services/chatMappers";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

function getAttachmentCategory(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

function AttachmentDraft({ file, previewUrl, progress, uploading, onRemove }) {
  if (!file) return null;
  const category = getAttachmentCategory(file);
  const Icon = category === "image" ? Image : category === "video" ? Video : FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      className="mb-2 overflow-hidden rounded-[18px] border border-zinc-200 !bg-zinc-50 p-2 shadow-sm dark:border-[#2A3242] dark:!bg-[#161A23]"
    >
      <div className="flex items-center gap-3">
        {category === "image" && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="h-14 w-14 rounded-[14px] object-cover" />
        ) : category === "video" && previewUrl ? (
          <video src={previewUrl} className="h-14 w-14 rounded-[14px] bg-black object-cover" muted />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-zinc-100 text-zinc-700 dark:bg-[#2A3242] dark:text-[#F3F4F6]">
            <Icon className="h-5 w-5" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-zinc-900 dark:text-[#F3F4F6]">{file.name}</p>
          <p className="mt-0.5 text-[10px] font-medium text-zinc-400">
            {category.toUpperCase()} · {formatFileSize(file.size)}
          </p>
          {uploading && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-[#2A3242]">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-[#7C3AED]"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={uploading}
          aria-label="Remove attachment"
          className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-[#2A3242] dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

const ComposerButton = forwardRef(function ComposerButton(
  { label, children, className = "", onClick, active = false },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      aria-pressed={active}
      whileHover={{ y: -2, scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[13px] transition-colors hover:bg-zinc-100 hover:text-black dark:hover:bg-[#2A3242] dark:hover:text-white ${
        active ? "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white dark:bg-[#7C3AED] dark:hover:bg-[#7C3AED]" : "text-zinc-400 dark:text-[#9CA3AF]"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
});

export default function MessageInput({
  onSend,
  onSendAttachment,
  onTypingChange,
  incomingFile,
  onIncomingFileConsumed,
  onToast,
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const activeFile = selectedFile || incomingFile || null;
  const incomingPreviewUrl = useMemo(() => {
    if (!incomingFile) return "";
    const category = getAttachmentCategory(incomingFile);
    return ["image", "video"].includes(category) ? URL.createObjectURL(incomingFile) : "";
  }, [incomingFile]);

  useEffect(
    () => () => {
      if (incomingPreviewUrl) URL.revokeObjectURL(incomingPreviewUrl);
    },
    [incomingPreviewUrl],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "36px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [text]);

  const clearSelectedFile = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
  }, []);

  const selectFile = useCallback(
    (file) => {
      if (!file) return;
      if (file.size > MAX_ATTACHMENT_SIZE) {
        onToast?.("File size must be less than 5 MB.", "error");
        return;
      }
      onIncomingFileConsumed?.();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const category = getAttachmentCategory(file);
      const objectUrl = ["image", "video"].includes(category) ? URL.createObjectURL(file) : "";
      previewUrlRef.current = objectUrl;
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      setUploadProgress(0);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [onIncomingFileConsumed, onToast],
  );

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const stopTyping = useCallback(() => {
    window.clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }, [onTypingChange]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  const scheduleTypingStop = useCallback(() => {
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(stopTyping, 1000);
  }, [stopTyping]);

  const notifyTypingForText = useCallback(
    (nextText) => {
      if (!nextText.trim()) {
        stopTyping();
        return;
      }

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange?.(true);
      }

      scheduleTypingStop();
    },
    [onTypingChange, scheduleTypingStop, stopTyping],
  );

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setText(nextText);
    notifyTypingForText(nextText);
  };

  const handleSend = () => {
    const content = text.trim();
    if (uploading) return;
    if (activeFile) {
      handleSendAttachment();
      return;
    }
    if (!content) return;
    stopTyping();
    onSend(content);
    setText("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSendAttachment = async () => {
    if (!activeFile || uploading) return;
    const file = activeFile;
    const content = text.trim();
    stopTyping();
    setUploading(true);
    setUploadProgress(1);

    try {
      await onSendAttachment(file, content, setUploadProgress);
      clearSelectedFile();
      onIncomingFileConsumed?.();
      setText("");
    } finally {
      setUploading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? text.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const nextText = `${text.slice(0, selectionStart)}${emoji}${text.slice(selectionEnd)}`;
    const nextCursorPosition = selectionStart + emoji.length;

    setText(nextText);
    notifyTypingForText(nextText);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleGifSelect = (gif) => {
    stopTyping();
    onSend(gif.url);
    setText("");
    setPickerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeActiveFile = () => {
    clearSelectedFile();
    onIncomingFileConsumed?.();
  };

  const activePreviewUrl = selectedFile ? previewUrl : incomingPreviewUrl;

  return (
    <footer className="soft-divider relative z-20 shrink-0 border-t border-zinc-200 !bg-white px-3 pb-3 pt-2 dark:border-[#2A3242] dark:!bg-[#0F1117] sm:px-6 sm:pb-5 sm:pt-3">
      <div className="relative mx-auto max-w-[880px]">
        <EmojiGifPopover
          open={pickerOpen}
          triggerRef={emojiButtonRef}
          onClose={closePicker}
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
        />

        <motion.div
          layout
          animate={{
            boxShadow: focused
              ? "0 16px 44px rgba(24,24,27,.17), 0 0 0 4px rgba(39,39,42,.08)"
              : "0 12px 34px rgba(65,61,113,.11), 0 1px 2px rgba(65,61,113,.05)",
          }}
          className="flex items-center gap-1 rounded-[22px] border border-zinc-200 !bg-white p-1.5 shadow-sm dark:border-[#2A3242] dark:!bg-[#1E2430] sm:gap-1.5 sm:p-2"
        >
          <ComposerButton label="Attach file" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-[18px] w-[18px]" />
          </ComposerButton>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div className="min-w-0 flex-1">
            <AnimatePresence>
              {activeFile && (
                <AttachmentDraft
                  file={activeFile}
                  previewUrl={activePreviewUrl}
                  progress={uploadProgress}
                  uploading={uploading}
                  onRemove={removeActiveFile}
                />
              )}
            </AnimatePresence>
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={activeFile ? "Add a caption..." : "Write a message..."}
              maxLength={5000}
              disabled={uploading}
              className="max-h-28 min-h-9 w-full resize-none overflow-y-auto bg-transparent px-1 py-2 text-[14px] leading-5 text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-wait disabled:opacity-60 dark:text-[#F3F4F6] dark:placeholder:text-[#6B7280] sm:px-2"
            />
          </div>

          <ComposerButton
            ref={emojiButtonRef}
            label="Open emoji and GIF picker"
            active={pickerOpen}
            onClick={() => setPickerOpen((isOpen) => !isOpen)}
          >
            <Smile className="h-[18px] w-[18px]" />
          </ComposerButton>
          <AnimatePresence mode="wait" initial={false}>
            {text.trim() || activeFile ? (
              <motion.button
                key="send"
                type="button"
                onClick={handleSend}
                aria-label="Send message"
                disabled={uploading}
                initial={{ scale: 0.55, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.55, rotate: 20, opacity: 0 }}
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.88 }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-zinc-700 to-black text-white shadow-[0_8px_20px_rgba(24,24,27,0.3)] disabled:cursor-wait disabled:opacity-60"
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Send className="h-[17px] w-[17px] translate-x-px" />
                )}
              </motion.button>
            ) : (
              <motion.button
                key="voice"
                type="button"
                aria-label="Record voice message"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.88 }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-slate-900 text-white shadow-[0_8px_18px_rgba(27,33,54,0.2)]"
              >
                <Mic className="h-[17px] w-[17px]" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </footer>
  );
}
