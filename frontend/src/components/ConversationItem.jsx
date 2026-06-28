import { motion } from "framer-motion";

export default function ConversationItem({ conversation, isActive, onSelect }) {
  const { username, initials, avatarGradient, lastMessage, timestamp, unreadCount, online } = conversation;

  return (
    <motion.button
      layout
      variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
      whileHover={isActive ? {} : { x: 3, scale: 1.008 }}
      whileTap={isActive ? {} : { scale: 0.985 }}
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex w-full items-center gap-3 overflow-hidden border-2 px-3 py-3 text-left transition-colors duration-300 ${
        isActive
          ? "rounded-[16px] border-zinc-950 bg-transparent text-zinc-950 shadow-none"
          : "rounded-[20px] border-transparent text-slate-800 hover:bg-white/65"
      }`}
    >
      <div className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-[17px] bg-gradient-to-br ${avatarGradient} text-[13px] font-bold text-white shadow-sm ring-2 ${isActive ? "ring-zinc-300" : "ring-white/75"}`}>
        {initials}
        {online && (
          <motion.span
            animate={{ boxShadow: ["0 0 0 0 rgba(34,197,94,.45)", "0 0 0 6px rgba(34,197,94,0)"] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-500"
          />
        )}
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">{username}</span>
          <span className={`shrink-0 text-[10px] font-medium ${isActive ? "text-zinc-600" : unreadCount ? "text-zinc-900" : "text-zinc-400"}`}>
            {timestamp}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className={`min-w-0 flex-1 truncate text-[12px] ${isActive ? "text-zinc-600" : unreadCount ? "font-medium text-zinc-700" : "text-zinc-400"}`}>
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.16 }}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
