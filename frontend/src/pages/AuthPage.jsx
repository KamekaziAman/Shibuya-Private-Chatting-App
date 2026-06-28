import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { getApiErrorMessage } from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const credentials = { username: username.trim(), password };
      if (isRegister) await register(credentials);
      else await login(credentials);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 grid min-h-dvh w-full place-items-center overflow-y-auto px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        <div className="mb-7 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">
            Secure conversations
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.055em] text-zinc-950">Shibuya</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-zinc-500">
            {isRegister
              ? "Create your account and start a private conversation."
              : "Welcome back. Sign in to continue your conversations."}
          </p>
        </div>

        <div className="rounded-[28px] border border-white/90 bg-white/62 p-3 shadow-[0_28px_70px_rgba(24,24,27,0.15)] backdrop-blur-2xl dark:border-[#27272A] dark:!bg-[#18181B] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="mb-3 grid grid-cols-2 rounded-[17px] bg-zinc-100/90 p-1 dark:border dark:border-[#27272A] dark:!bg-[#09090B]">
            {["login", "register"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => changeMode(tab)}
                className={`relative h-10 rounded-[13px] text-xs font-bold capitalize transition-colors ${mode === tab ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-[#A1A1AA]"}`}
              >
                {mode === tab && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-[13px] border border-zinc-200/80 bg-white shadow-sm dark:border-[#3F3F46] dark:!bg-[#27272A] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{tab}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 rounded-[20px] bg-white/45 p-3 sm:p-4 dark:border dark:border-[#27272A] dark:!bg-[#09090B]">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Username
              </span>
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  placeholder="Enter your username"
                  className="h-12 w-full rounded-[15px] border border-zinc-200 bg-white/80 pl-10 pr-4 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-4 focus:ring-zinc-200/70 dark:border-[#3F3F46] dark:!bg-[#27272A] dark:text-[#F4F4F5] dark:placeholder:text-[#71717A] dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Password
              </span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-[15px] border border-zinc-200 bg-white/80 pl-10 pr-11 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-4 focus:ring-zinc-200/70 dark:border-[#3F3F46] dark:!bg-[#27272A] dark:text-[#F4F4F5] dark:placeholder:text-[#71717A] dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 dark:text-[#A1A1AA] dark:hover:bg-[#3F3F46] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="block overflow-hidden"
                >
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Confirm password
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required={isRegister}
                    placeholder="Repeat your password"
                    className="h-12 w-full rounded-[15px] border border-zinc-200 bg-white/80 px-4 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-4 focus:ring-zinc-200/70 dark:border-[#3F3F46] dark:!bg-[#27272A] dark:text-[#F4F4F5] dark:placeholder:text-[#71717A] dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
                  />
                </motion.label>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="rounded-[13px] border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-xs font-medium text-zinc-700 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-zinc-950 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,24,27,0.24)] transition-opacity disabled:cursor-wait disabled:opacity-60 dark:!bg-zinc-100 dark:!text-zinc-950 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)] dark:hover:!bg-white"
            >
              {submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
