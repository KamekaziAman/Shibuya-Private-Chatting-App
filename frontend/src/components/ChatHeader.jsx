import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";

export default function ChatHeader({
  conversation,
  connectionStatus,
  typingUsername,
  onBack,
  onClearConversation,
  clearingConversation = false,
}) {
  const { username, initials, avatarGradient, online, status } = conversation;
  const isConnected = connectionStatus === "open";
  const statusText = typingUsername
    ? "Typing..."
    : connectionStatus === "reconnecting"
      ? "Reconnecting..."
      : connectionStatus === "connecting"
        ? "Connecting..."
        : online
          ? "Online"
          : status;

  return (
    <header className="soft-divider sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white/60 px-3 backdrop-blur-2xl sm:h-[78px] sm:gap-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          aria-label="Back to conversations"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-white/70 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>

        <div
          className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br ${avatarGradient} text-[11px] font-bold text-white shadow-md ring-2 ring-white/70 sm:h-11 sm:w-11 sm:rounded-[16px] sm:text-xs`}
        >
          {initials}
          {online && (
            <motion.span
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(34,197,94,.45)",
                  "0 0 0 7px rgba(34,197,94,0)",
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-500"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <button className="flex max-w-full min-w-0 items-center gap-1 text-left">
            <h2 className="min-w-0 truncate text-[14px] font-bold tracking-[-0.02em] text-slate-900 sm:text-[15px]">
              {username}
            </h2>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>

          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                online ? "bg-emerald-500" : isConnected ? "bg-zinc-900" : "bg-zinc-300"
              }`}
            />
            <p
              className={`truncate text-[11px] ${
                typingUsername || online ? "font-medium text-zinc-700" : "text-zinc-400"
              }`}
            >
              {statusText}
            </p>
            {typingUsername && (
              <span className="flex shrink-0 items-center gap-0.5">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: dot * 0.12 }}
                    className="h-1 w-1 rounded-full bg-zinc-600"
                  />
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className="grid h-9 w-9 place-items-center rounded-full border border-white/80 bg-white/40 text-zinc-700 shadow-sm backdrop-blur-xl sm:flex sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px] sm:font-semibold sm:text-slate-400"
          title="End-to-end encrypted"
          aria-label="End-to-end encrypted"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
          <span className="hidden md:inline">End-to-end encrypted</span>
        </div>
        <motion.button
          type="button"
          onClick={onClearConversation}
          disabled={clearingConversation}
          aria-label="Clear conversation"
          title="Clear conversation"
          whileHover={{ y: -1, scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          className="grid h-9 w-9 place-items-center rounded-full border border-red-400/35 bg-red-500/12 text-red-500 shadow-sm backdrop-blur-xl transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-red-400/25 dark:bg-red-500/15 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white disabled:cursor-wait disabled:opacity-60 disabled:hover:border-red-400/35 disabled:hover:bg-red-500/12 disabled:hover:text-red-500"
        >
          {clearingConversation ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </motion.button>
      </div>
    </header>
  );
}
