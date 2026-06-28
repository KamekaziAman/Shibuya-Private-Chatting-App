import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, loading = false, typingUsername }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typingUsername]);

  return (
    <div className="chat-pattern relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-5 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/18 to-transparent dark:from-[#0F1117]/55 dark:via-[#0F1117]/18 dark:to-transparent" />
      <div className="relative mx-auto flex min-h-full w-full min-w-0 max-w-[860px] flex-col justify-end">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200/80" />
          <span className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 shadow-sm backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-zinc-500" /> Today
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200/80" />
        </div>

        {loading ? (
          <div className="space-y-4 py-6" aria-label="Loading messages">
            {["w-44", "ml-auto w-64", "w-72", "ml-auto w-48"].map((width, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.08 }}
                className={`h-12 animate-pulse rounded-[18px] bg-zinc-200/70 ${width}`}
              />
            ))}
          </div>
        ) : (
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const startsGroup = !previous || previous.sender !== message.sender;
            const endsGroup = !next || next.sender !== message.sender;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                startsGroup={startsGroup}
                endsGroup={endsGroup}
              />
            );
          })}
        </AnimatePresence>
        )}

        {!loading && !messages.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="my-auto py-20 text-center">
            <p className="text-sm font-medium text-slate-500">A fresh conversation</p>
            <p className="mt-1 text-xs text-slate-400">Send a message to say hello.</p>
          </motion.div>
        )}
        <AnimatePresence>
          {!loading && typingUsername && (
            <motion.div
              initial={{ opacity: 0, x: -8, y: 6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mb-3 flex items-center gap-2 self-start rounded-[16px] border border-white/90 bg-white/75 px-3 py-2 text-[10px] font-medium text-zinc-500 shadow-sm backdrop-blur-xl"
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: dot * 0.12 }}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-500"
                  />
                ))}
              </span>
              Typing...
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
