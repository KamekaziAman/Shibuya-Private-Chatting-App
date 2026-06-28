import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import useTheme from "../hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      className="relative flex h-8 w-[58px] shrink-0 items-center rounded-xl border border-zinc-200/80 bg-white/75 p-1 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-[#2A3242] dark:bg-[#1E2430]"
    >
      <motion.span
        layout
        animate={{ x: isDark ? 26 : 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className="absolute left-1 grid h-6 w-6 place-items-center rounded-lg bg-zinc-950 text-white shadow-[0_6px_14px_rgba(24,24,27,0.2)] dark:bg-[#7C3AED] dark:shadow-[0_6px_18px_rgba(124,58,237,0.35)]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              <Moon className="h-3.5 w-3.5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              <Sun className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>

      <span className="ml-auto grid h-6 w-6 place-items-center text-zinc-400 transition-colors dark:text-[#9CA3AF]">
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
    </motion.button>
  );
}
