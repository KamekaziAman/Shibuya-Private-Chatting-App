import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LoaderCircle,
  LogOut,
  Search,
  SquarePen,
} from "lucide-react";
import { useRef } from "react";
import ConversationItem from "./ConversationItem";
import ThemeToggle from "./ThemeToggle";
import { getInitials } from "../services/chatMappers";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export default function Sidebar({
  conversations,
  activeConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  searchResults,
  searchingUsers,
  onStartConversation,
  conversationsLoading,
  conversationsError,
  onRetryConversations,
  currentUser,
  onLogout,
}) {
  const searchInputRef = useRef(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter(({ username }) =>
    username.toLowerCase().includes(normalizedQuery),
  );
  const isPeopleSearch = normalizedQuery.length >= 2;

  return (
    <div className="soft-divider flex h-full w-full min-w-0 flex-col border-r bg-white/48 backdrop-blur-2xl">
      <div className="soft-divider border-b px-5 pb-4 pt-5">
        <div className="mb-6 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl text-left"
          >
            <span className="flex items-center gap-1 text-[16px] font-bold tracking-[-0.03em] text-slate-900">
              Shibuya <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <span className="block text-[11px] font-medium tracking-wide text-slate-400">
              PERSONAL WORKSPACE
            </span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            whileHover={{ y: -2, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Find someone to message"
            className="grid h-10 w-10 place-items-center rounded-[14px] border border-white bg-white/80 text-zinc-800 shadow-sm transition-shadow hover:shadow-md"
          >
            <SquarePen className="h-[18px] w-[18px]" />
          </motion.button>
        </div>

        <label className="group relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-black" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search people or chats"
            className="h-11 w-full rounded-[16px] border-1 border-zinc-950 bg-white/58 pl-10 pr-10 text-sm text-zinc-700 shadow-[inset_0_1px_2px_rgba(24,24,27,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-black focus:bg-white/90 focus:ring-4 focus:ring-zinc-300/30"
          />
          {searchingUsers && (
            <LoaderCircle className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
          )}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <AnimatePresence initial={false}>
          {isPeopleSearch && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="px-2 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                People
              </p>
              <div className="space-y-1">
                {searchResults.map((person) => (
                  <motion.button
                    key={person.id}
                    type="button"
                    onClick={() => onStartConversation(person)}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.985 }}
                    className="flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left hover:bg-white/70"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-zinc-900 text-[11px] font-bold text-white">
                      {getInitials(person.username)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
                      {person.username}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400">
                      Message
                    </span>
                  </motion.button>
                ))}
                {!searchingUsers && searchResults.length === 0 && (
                  <p className="rounded-[14px] bg-zinc-100/60 px-3 py-4 text-center text-xs text-zinc-400">
                    No users found for “{searchQuery.trim()}”
                  </p>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between px-2 pb-2 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Messages
          </p>
          <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-800">
            {conversations.reduce((total, item) => total + item.unreadCount, 0)}{" "}
            new
          </span>
        </div>

        {conversationsError && (
          <div className="mb-3 rounded-[15px] border border-zinc-300 bg-zinc-100 p-3 text-xs text-zinc-600">
            <p>{conversationsError}</p>
            <button
              type="button"
              onClick={onRetryConversations}
              className="mt-2 font-bold text-zinc-950 underline"
            >
              Try again
            </button>
          </div>
        )}

        {conversationsLoading ? (
          <div className="space-y-2 px-1" aria-label="Loading conversations">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-3 rounded-[18px] p-3"
              >
                <span className="h-11 w-11 rounded-[15px] bg-zinc-200" />
                <span className="space-y-2">
                  <span className="block h-3 w-28 rounded bg-zinc-200" />
                  <span className="block h-2.5 w-40 rounded bg-zinc-100" />
                </span>
              </div>
            ))}
          </div>
        ) : filteredConversations.length ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1.5"
          >
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={onSelectConversation}
              />
            ))}
          </motion.div>
        ) : (
          <div className="mx-1 mt-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/60 px-4 py-7 text-center">
            <Search className="mx-auto mb-3 h-5 w-5 text-zinc-400" />
            <p className="text-sm font-medium text-slate-600">
              {normalizedQuery
                ? "No matching conversations"
                : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {normalizedQuery
                ? "Search for a person above."
                : "Find a user to start messaging."}
            </p>
          </div>
        )}
      </div>

      <div className="soft-divider border-t bg-white/34 p-3">
        <div className="flex items-center gap-3 rounded-[18px] px-2 py-2">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold text-white shadow-md">
            {getInitials(currentUser?.username)}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-zinc-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {currentUser?.username}
            </p>
            <p className="truncate text-[11px] text-slate-400">Signed in</p>
          </div>
          <ThemeToggle />
          <motion.button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            whileHover={{ scale: 1.08, color: "#09090b" }}
            whileTap={{ scale: 0.9 }}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-white/80"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
