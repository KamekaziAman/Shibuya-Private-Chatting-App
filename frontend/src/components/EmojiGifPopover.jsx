import { AnimatePresence, motion } from "framer-motion";
import { ImagePlay, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";

const tabs = [
  { id: "emojis", label: "Emojis", icon: Smile },
  { id: "gifs", label: "GIFs", icon: ImagePlay },
];

export default function EmojiGifPopover({
  open,
  triggerRef,
  onClose,
  onEmojiSelect,
  onGifSelect,
}) {
  const popoverRef = useRef(null);
  const [activeTab, setActiveTab] = useState("emojis");

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      onClose();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          // initial={{ opacity: 0, y: 36, scale: 1 }}
          // animate={{ opacity: 1, y: 0, scale: 1 }}
          // exit={{ opacity: 0, y: 30, scale: 0.97 }}
          // transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute bottom-full right-0 z-40 mb-3 flex h-[430px] w-[min(420px,calc(100vw-24px))] max-w-full flex-col rounded-[24px] border-2 border-zinc-950/80 bg-white p-3 shadow-[0_24px_70px_rgba(24,24,27,0.22)]"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-[22px] bg-white" />

          <div className="mb-3 grid grid-cols-2 gap-1 rounded-[16px] border border-white/80 bg-zinc-100/70 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex h-10 items-center justify-center gap-2 rounded-[13px] text-sm font-bold transition ${
                  activeTab === id
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-white/80 hover:text-zinc-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "emojis" ? (
                <motion.div
                  key="emojis"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="h-full"
                >
                  <EmojiPicker onSelect={onEmojiSelect} />
                </motion.div>
              ) : (
                <motion.div
                  key="gifs"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="h-full"
                >
                  <GifPicker onSelect={onGifSelect} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
