import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const GIPHY_BASE_URL = "https://api.giphy.com/v1/gifs";

function normalizeGif(gif) {
  const preview = gif.images?.fixed_width_small?.webp || gif.images?.fixed_width_small?.url;
  const url = gif.images?.original?.webp || gif.images?.original?.url || gif.url;

  return {
    id: gif.id,
    title: gif.title || "GIF",
    preview,
    url,
  };
}

export default function GifPicker({ onSelect }) {
  const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(Boolean(apiKey));
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const endpoint = useMemo(() => {
    if (!apiKey) return null;

    const params = new URLSearchParams({
      api_key: apiKey,
      limit: "24",
      rating: "pg-13",
      bundle: "messaging_non_clips",
    });

    if (debouncedQuery) {
      params.set("q", debouncedQuery);
      return `${GIPHY_BASE_URL}/search?${params.toString()}`;
    }

    return `${GIPHY_BASE_URL}/trending?${params.toString()}`;
  }, [apiKey, debouncedQuery]);

  useEffect(() => {
    if (!endpoint) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadGifs() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load GIFs right now.");
        const data = await response.json();
        setGifs((data.data || []).map(normalizeGif).filter(({ preview, url }) => preview && url));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setGifs([]);
          setError(fetchError.message || "Could not load GIFs right now.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadGifs();
    return () => controller.abort();
  }, [endpoint]);

  if (!apiKey) {
    return (
      <div className="grid h-full place-items-center rounded-[20px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <div>
          <p className="text-sm font-bold text-zinc-900">Add a Giphy API key</p>
          <p className="mx-auto mt-2 max-w-[260px] text-xs leading-5 text-zinc-500">
            Set <span className="font-mono font-semibold text-zinc-800">VITE_GIPHY_API_KEY</span> in
            your frontend env file to enable trending and GIF search.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search GIFs"
          className="h-10 w-full rounded-[14px] border-2 border-zinc-200 bg-white pl-9 pr-9 text-sm text-zinc-800 outline-none transition focus:border-zinc-950 focus:bg-white"
        />
        {loading && (
          <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </label>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          {debouncedQuery ? `Results for ${debouncedQuery}` : "Trending GIFs"}
        </p>
        <span className="text-[10px] font-medium text-zinc-400">Powered by Giphy</span>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <div className="grid h-full place-items-center rounded-[18px] border border-dashed border-zinc-300 bg-white/45 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-700">{error}</p>
            <p className="mt-1 text-xs text-zinc-400">Try another search in a moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif)}
                className="group relative aspect-[1.22] overflow-hidden rounded-[14px] bg-zinc-100 shadow-sm transition hover:scale-[1.025] hover:shadow-md"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-5 text-left text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  {gif.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="grid h-full place-items-center rounded-[18px] border border-dashed border-zinc-300 bg-white/45 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-700">No GIFs found</p>
            <p className="mt-1 text-xs text-zinc-400">Try another search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
