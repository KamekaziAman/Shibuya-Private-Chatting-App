import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const RECENT_EMOJIS_KEY = "shibuya_recent_emojis";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    label: "Smileys",
    icon: "😊",
    items: [
      ["😀", "grinning face happy smile"],
      ["😃", "smile happy"],
      ["😄", "laugh happy"],
      ["😁", "grin beam"],
      ["😆", "laugh squint"],
      ["😅", "sweat smile relief"],
      ["😂", "joy tears laugh"],
      ["🤣", "rolling laugh"],
      ["🙂", "slight smile"],
      ["🙃", "upside down"],
      ["😉", "wink"],
      ["😊", "blush smile"],
      ["😇", "angel"],
      ["🥰", "hearts loved"],
      ["😍", "heart eyes love"],
      ["🤩", "star eyes wow"],
      ["😘", "kiss"],
      ["😋", "yum tasty"],
      ["😜", "playful tongue"],
      ["🤪", "silly goofy"],
      ["😎", "cool sunglasses"],
      ["🥳", "party celebrate"],
      ["😏", "smirk"],
      ["😌", "relieved calm"],
      ["😔", "sad pensive"],
      ["🥺", "pleading cute"],
      ["😢", "cry sad"],
      ["😭", "sob crying"],
      ["😤", "triumph"],
      ["😡", "angry"],
      ["🤯", "mind blown"],
      ["😴", "sleep"],
      ["🤔", "thinking"],
      ["🫡", "salute"],
    ],
  },
  {
    id: "people",
    label: "People",
    icon: "👋",
    items: [
      ["👋", "wave hello"],
      ["👌", "ok perfect"],
      ["🤌", "chef kiss"],
      ["🤞", "fingers crossed"],
      ["✌️", "peace"],
      ["🤟", "love you"],
      ["🤘", "rock"],
      ["👍", "thumbs up"],
      ["👎", "thumbs down"],
      ["👏", "clap"],
      ["🙌", "raise hands"],
      ["🫶", "heart hands"],
      ["🙏", "pray thanks"],
      ["💪", "strong flex"],
      ["🫂", "hug"],
      ["🧠", "brain smart"],
      ["👀", "eyes look"],
      ["🗣️", "speak"],
      ["👑", "crown"],
      ["🕺", "dance"],
    ],
  },
  {
    id: "love",
    label: "Love",
    icon: "❤️",
    items: [
      ["❤️", "red heart love"],
      ["🖤", "black heart"],
      ["🤍", "white heart"],
      ["💜", "purple heart"],
      ["💙", "blue heart"],
      ["💚", "green heart"],
      ["💛", "yellow heart"],
      ["🧡", "orange heart"],
      ["💕", "two hearts"],
      ["💞", "revolving hearts"],
      ["💘", "cupid heart"],
      ["💝", "gift heart"],
      ["💔", "broken heart"],
      ["💯", "hundred"],
      ["✨", "sparkles"],
      ["⭐", "star"],
      ["🌟", "glowing star"],
      ["🔥", "fire"],
      ["💫", "dizzy"],
      ["⚡", "bolt"],
    ],
  },
  {
    id: "animals",
    label: "Animals",
    icon: "🐶",
    items: [
      ["🐶", "dog"],
      ["🐱", "cat"],
      ["🐭", "mouse"],
      ["🐹", "hamster"],
      ["🐰", "rabbit"],
      ["🦊", "fox"],
      ["🐻", "bear"],
      ["🐼", "panda"],
      ["🐨", "koala"],
      ["🐯", "tiger"],
      ["🦁", "lion"],
      ["🐮", "cow"],
      ["🐸", "frog"],
      ["🐵", "monkey"],
      ["🐧", "penguin"],
      ["🐦", "bird"],
      ["🦋", "butterfly"],
      ["🐢", "turtle"],
      ["🐙", "octopus"],
      ["🐬", "dolphin"],
    ],
  },
  {
    id: "food",
    label: "Food",
    icon: "🍕",
    items: [
      ["🍎", "apple"],
      ["🍌", "banana"],
      ["🍓", "strawberry"],
      ["🍒", "cherries"],
      ["🍉", "watermelon"],
      ["🍕", "pizza"],
      ["🍔", "burger"],
      ["🍟", "fries"],
      ["🌮", "taco"],
      ["🍜", "ramen noodles"],
      ["🍝", "pasta"],
      ["🍣", "sushi"],
      ["🍩", "donut"],
      ["🍪", "cookie"],
      ["🍰", "cake"],
      ["☕", "coffee"],
      ["🧋", "bubble tea"],
      ["🍺", "beer"],
      ["🥂", "cheers"],
      ["🍾", "bottle"],
    ],
  },
  {
    id: "activity",
    label: "Activity",
    icon: "🎮",
    items: [
      ["⚽", "football soccer"],
      ["🏀", "basketball"],
      ["🏏", "cricket"],
      ["🎮", "game controller"],
      ["🎧", "headphones music"],
      ["🎤", "microphone sing"],
      ["🎬", "movie cinema"],
      ["🎨", "art paint"],
      ["📚", "books study"],
      ["💻", "laptop code"],
      ["🚀", "rocket launch"],
      ["🏆", "trophy win"],
      ["🥇", "gold medal"],
      ["🎯", "target"],
      ["🎲", "dice"],
      ["🧩", "puzzle"],
    ],
  },
  {
    id: "objects",
    label: "Objects",
    icon: "💡",
    items: [
      ["💡", "idea bulb"],
      ["📌", "pin"],
      ["📎", "paperclip"],
      ["📅", "calendar"],
      ["⏰", "alarm clock"],
      ["💬", "chat message"],
      ["📱", "phone"],
      ["⌨️", "keyboard"],
      ["🔒", "lock secure"],
      ["🔑", "key"],
      ["🛠️", "tools"],
      ["⚙️", "settings"],
      ["📦", "package"],
      ["🎁", "gift"],
      ["💎", "diamond"],
      ["🪄", "magic"],
    ],
  },
];

function getRecentEmojis() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) || "[]").slice(0, 24);
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji) {
  const recent = getRecentEmojis().filter((item) => item !== emoji);
  localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify([emoji, ...recent].slice(0, 24)));
}

export default function EmojiPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState(getRecentEmojis);

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const recentCategory = {
      id: "recent",
      label: "Recent",
      icon: "🕘",
      items: recentEmojis.map((emoji) => [emoji, "recent"]),
    };

    const categories = recentEmojis.length ? [recentCategory, ...EMOJI_CATEGORIES] : EMOJI_CATEGORIES;

    if (!normalizedQuery) return categories;

    return EMOJI_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter(([emoji, keywords]) =>
        `${emoji} ${keywords}`.toLowerCase().includes(normalizedQuery),
      ),
    })).filter((category) => category.items.length);
  }, [query, recentEmojis]);

  const selectedCategory =
    visibleCategories.find((category) => category.id === activeCategory) ?? visibleCategories[0];

  const handleSelect = (emoji) => {
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
    onSelect(emoji);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search emojis"
          className="h-10 w-full rounded-[14px] border-2 border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-950 focus:bg-white"
        />
      </label>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {visibleCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            title={category.label}
            className={`grid h-9 min-w-9 place-items-center rounded-[12px] text-lg transition ${
              selectedCategory?.id === category.id
                ? "bg-zinc-950 text-white shadow-sm"
                : "bg-zinc-100 hover:bg-zinc-200"
            }`}
          >
            {category.icon}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {selectedCategory ? (
          <>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              {query ? "Results" : selectedCategory.label}
            </p>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-9">
              {selectedCategory.items.map(([emoji, keywords]) => (
                <button
                  key={`${emoji}-${keywords}`}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="grid h-9 place-items-center rounded-[12px] text-[22px] transition hover:bg-zinc-100 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center rounded-[18px] border border-dashed border-zinc-300 bg-white/45 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-700">No emojis found</p>
            <p className="mt-1 text-xs text-zinc-400">Try “heart”, “laugh”, or “fire”.</p>
          </div>
        )}
      </div>
    </div>
  );
}
