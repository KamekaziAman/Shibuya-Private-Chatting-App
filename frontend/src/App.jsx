import ChatLayout from "./components/ChatLayout";
import useAuth from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";

function SessionLoader() {
  return (
    <div className="relative z-10 grid min-h-dvh w-full place-items-center">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
        <p className="mt-3 text-xs font-medium text-zinc-500">Restoring your session…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <main className="app-background">
      <div className="ambient-orb ambient-orb--one" />
      <div className="ambient-orb ambient-orb--two" />
      {loading ? <SessionLoader /> : isAuthenticated ? <ChatLayout /> : <AuthPage />}
    </main>
  );
}
