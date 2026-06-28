import { motion } from "framer-motion";
import {
  Archive,
  CheckCheck,
  Download,
  ExternalLink,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderContent(content, isSent) {
  return content?.split(URL_REGEX).map((part, index) =>
    /^https?:\/\/[^\s]+$/.test(part) ? (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 break-all font-medium underline decoration-1 underline-offset-2 ${isSent ? "decoration-white/45 hover:decoration-white" : "text-zinc-900 decoration-zinc-400"}`}
      >
        {part}
        <ExternalLink className="inline h-3 w-3 shrink-0" />
      </a>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function downloadAttachment(attachment) {
  const link = document.createElement("a");
  link.href = attachment.url;
  link.download = attachment.name;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function AttachmentIcon({ attachment, className = "h-[18px] w-[18px]" }) {
  const extension = attachment.extension?.toLowerCase();
  if (attachment.category === "image") return <ImageIcon className={className} />;
  if (attachment.category === "video") return <FileVideo className={className} />;
  if (attachment.mimeType?.startsWith("audio/") || ["mp3", "wav", "m4a"].includes(extension)) {
    return <FileAudio className={className} />;
  }
  if (["zip", "rar", "7z"].includes(extension)) return <Archive className={className} />;
  return <FileText className={className} />;
}

function ImageLightbox({ attachment, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${attachment.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-black"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={attachment.url}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl brightness-[0.55] saturate-150"
        />
        <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      </div>

      <div
        className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="min-w-0 truncate text-sm font-medium text-white/90">{attachment.name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            onClick={() => downloadAttachment(attachment)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </motion.button>
          <motion.button
            type="button"
            aria-label="Close image preview"
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <motion.img
          src={attachment.url}
          alt={attachment.name}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="max-h-full max-w-full select-none object-contain"
          onClick={(event) => event.stopPropagation()}
          draggable={false}
        />
      </div>
    </motion.div>,
    document.body,
  );
}

function AttachmentPreview({ attachment, isSent }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  if (!attachment) return null;

  if (attachment.category === "image") {
    return (
      <>
        <motion.div
          type="button"
          whileHover={{ scale: 1.01 }}
          onClick={() => setLightboxOpen(true)}
          className="group relative mb-2 cursor-pointer overflow-hidden rounded-[15px]"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="h-48 w-full min-w-[245px] object-cover sm:h-56 sm:min-w-[330px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
          <span className="absolute bottom-2.5 left-3 text-[10px] font-medium text-white/90">
            {attachment.name}
          </span>
          <button
            type="button"
            aria-label={`Download ${attachment.name}`}
            onClick={(event) => {
              event.stopPropagation();
              downloadAttachment(attachment);
            }}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-xl bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </motion.div>
        {lightboxOpen && <ImageLightbox attachment={attachment} onClose={() => setLightboxOpen(false)} />}
      </>
    );
  }

  if (attachment.category === "video") {
    return (
      <div className="mb-2 overflow-hidden rounded-[15px]">
        <video
          src={attachment.url}
          controls
          preload="metadata"
          className="max-h-72 w-full min-w-[245px] bg-black object-contain sm:min-w-[330px]"
        >
          <a href={attachment.url} download={attachment.name}>Download video</a>
        </video>
        <div className={`flex items-center justify-between gap-3 px-3 py-2 text-[10px] ${isSent ? "bg-white/10 text-white/75" : "bg-zinc-100 text-zinc-500 dark:bg-[#1E2430] dark:text-[#9CA3AF]"}`}>
          <span className="truncate">{attachment.name}</span>
          <button
            type="button"
            onClick={() => downloadAttachment(attachment)}
            className="flex items-center gap-1 font-bold"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`mb-2 flex min-w-[235px] items-center gap-3 rounded-[15px] border p-2.5 ${
        isSent
          ? "border-white/15 bg-white/10"
          : "border-slate-100 bg-slate-50/80 dark:border-[#2A3242] dark:bg-[#1E2430]"
      }`}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${isSent ? "bg-white/15" : "bg-zinc-200 text-zinc-800 dark:bg-[#2A3242] dark:text-[#F3F4F6]"}`}>
        <AttachmentIcon attachment={attachment} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{attachment.name}</span>
        <span className={`mt-0.5 block text-[10px] ${isSent ? "text-white/55" : "text-slate-400"}`}>
          {attachment.extension} · {attachment.formattedSize}
        </span>
      </span>
      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        onClick={() => downloadAttachment(attachment)}
        aria-label={`Download ${attachment.name}`}
        className={`grid h-8 w-8 place-items-center rounded-xl ${isSent ? "bg-white/10 text-white/80" : "bg-white text-slate-400 shadow-sm dark:bg-[#161A23] dark:text-[#9CA3AF]"}`}
      >
        <Download className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  );
}

export default function MessageBubble({ message, startsGroup, endsGroup }) {
  const isSent = message.sender === "me";

  const sentRadius = `${
    startsGroup ? "rounded-tr-[20px]" : "rounded-tr-[7px]"
  } ${endsGroup ? "rounded-br-[7px]" : "rounded-br-[20px]"}`;

  const receivedRadius = `${
    startsGroup ? "rounded-tl-[20px]" : "rounded-tl-[7px]"
  } ${endsGroup ? "rounded-bl-[7px]" : "rounded-bl-[20px]"}`;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14, x: isSent ? 12 : -12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 330, damping: 28 }}
      className={`flex w-full min-w-0 ${
        isSent ? "justify-end" : "justify-start"
      } ${endsGroup ? "mb-4" : "mb-1.5"}`}
    >
      <div
        className={`flex min-w-0 max-w-[86%] flex-col sm:max-w-[72%] ${
          isSent ? "items-end" : "items-start"
        }`}
      >
        {startsGroup && message.senderName && !isSent && (
          <span className="mb-1.5 ml-2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            {message.senderName}
          </span>
        )}

        <motion.div
          whileHover={{ y: -1 }}
          className={`max-w-full min-w-0 rounded-[20px] px-3.5 py-2.5 text-[13.5px] leading-[1.55] shadow-sm sm:text-sm ${
            isSent
              ? `${sentRadius}
                 bg-gradient-to-br
                 from-zinc-800
                 via-zinc-900
                 to-black
                 text-white
                 shadow-[0_8px_22px_rgba(24,24,27,0.25)]
                 dark:bg-none
                 dark:!bg-zinc-800
                 dark:border
                 dark:border-zinc-700
                 dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]`
              : `${receivedRadius}
                 border
                 border-white/90
                 bg-white/85
                 text-slate-700
                 shadow-[0_5px_18px_rgba(61,57,98,0.07)]
                 backdrop-blur-xl
                 dark:border-zinc-800
                 dark:!bg-zinc-900
                 dark:text-zinc-100
                 dark:shadow-none
                 dark:backdrop-blur-none`
          }`}
        >
          <AttachmentPreview
            attachment={message.attachment}
            isSent={isSent}
          />

          {message.content && (
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {renderContent(message.content, isSent)}
            </p>
          )}
        </motion.div>

        {endsGroup && (
          <span
            className={`mt-1.5 flex items-center gap-1 px-1 text-[9.5px] font-medium text-slate-400 dark:text-zinc-500 ${
              isSent ? "flex-row-reverse" : ""
            }`}
          >
            {message.timestamp}

            {isSent && (
              <>
                <CheckCheck className="h-3 w-3 text-zinc-700 dark:text-zinc-400" />
                {message.status && <span>{message.status}</span>}
              </>
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
}