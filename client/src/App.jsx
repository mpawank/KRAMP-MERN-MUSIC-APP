import { useState, useEffect } from "react";
import YouTube from "react-youtube";

export default function App() {
  const [query, setQuery] = useState("Coke Studio Pakistan");
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [jamendoResults, setJamendoResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("youtube"); // youtube, jamendo, or all
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [searchMode, setSearchMode] = useState("single"); // single or dual

  const API_BASE = "http://localhost:5000/api";
  const FETCH_TIMEOUT = 8000; // 8 seconds timeout for YouTube

  // Get current results based on active tab
  const getCurrentResults = () => {
    if (activeTab === "youtube") return youtubeResults;
    if (activeTab === "jamendo") return jamendoResults;
    return [...youtubeResults, ...jamendoResults]; // all
  };

  // Fetch with timeout helper
  async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // Dual search - search both platforms simultaneously
  async function searchBoth() {
    if (!query.trim()) return;

    setLoading(true);
    setYoutubeResults([]);
    setJamendoResults([]);
    setError(null);
    setIsFallback(false);

    // Search both platforms in parallel
    const [youtubeData, jamendoData] = await Promise.allSettled([
      fetchWithTimeout(
        `${API_BASE}/youtube/search?q=${encodeURIComponent(query)}`
      ).then((res) => res.json()),
      fetchWithTimeout(
        `${API_BASE}/jamendo/search?q=${encodeURIComponent(query)}`,
        10000
      ).then((res) => res.json()),
    ]);

    // Process YouTube results
    if (youtubeData.status === "fulfilled" && youtubeData.value.results) {
      setYoutubeResults(youtubeData.value.results);
    }

    // Process Jamendo results
    if (jamendoData.status === "fulfilled" && jamendoData.value.results) {
      setJamendoResults(jamendoData.value.results);
    }

    // Show appropriate tab
    if (
      youtubeData.status === "fulfilled" &&
      youtubeData.value.results?.length > 0
    ) {
      setActiveTab("youtube");
    } else if (
      jamendoData.status === "fulfilled" &&
      jamendoData.value.results?.length > 0
    ) {
      setActiveTab("jamendo");
      setIsFallback(true);
    }

    setLoading(false);
  }

  // Main search function with automatic fallback
  async function searchMusic(manualSource = null) {
    if (!query.trim()) return;

    // If dual search mode, search both
    if (searchMode === "dual") {
      return searchBoth();
    }

    setLoading(true);
    setYoutubeResults([]);
    setJamendoResults([]);
    setError(null);
    setIsFallback(false);

    const searchSource = manualSource || activeTab;

    // Try YouTube first (if not manually selecting Jamendo)
    if (searchSource === "youtube") {
      try {
        console.log("🎬 Attempting YouTube search...");
        const res = await fetchWithTimeout(
          `${API_BASE}/youtube/search?q=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          throw new Error(`YouTube API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.results && data.results.length > 0) {
          console.log("✅ YouTube search successful!");
          setYoutubeResults(data.results);
          setActiveTab("youtube");
          setLoading(false);
          return; // Success! Exit early
        } else {
          console.warn("⚠️ YouTube returned empty results, trying fallback...");
          throw new Error("No YouTube results");
        }
      } catch (err) {
        console.error("❌ YouTube failed:", err.message);

        // Check if it's a network/timeout error or blocked
        if (
          err.name === "AbortError" ||
          err.message.includes("fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Failed to fetch")
        ) {
          console.log(
            "🔄 YouTube appears blocked or unavailable, falling back to Jamendo..."
          );
          setIsFallback(true);
        } else {
          console.log("🔄 YouTube error, falling back to Jamendo...");
          setIsFallback(true);
        }

        // Fallback to Jamendo
        try {
          const jamendoRes = await fetchWithTimeout(
            `${API_BASE}/jamendo/search?q=${encodeURIComponent(query)}`,
            10000
          );

          if (!jamendoRes.ok) {
            throw new Error(`Jamendo API returned ${jamendoRes.status}`);
          }

          const jamendoData = await jamendoRes.json();

          if (jamendoData.results && jamendoData.results.length > 0) {
            console.log("✅ Jamendo fallback successful!");
            setJamendoResults(jamendoData.results);
            setActiveTab("jamendo");
            setError(null);
          } else {
            setError(
              "No results found on YouTube or Jamendo. Try a different search."
            );
          }
        } catch (jamendoErr) {
          console.error("❌ Jamendo also failed:", jamendoErr.message);
          setError(
            "Unable to search music. Please check your internet connection and ensure the backend server is running."
          );
        }
      }
    } else {
      // Manual Jamendo search (user clicked Jamendo button)
      try {
        console.log("🎵 Searching Jamendo...");
        const res = await fetchWithTimeout(
          `${API_BASE}/jamendo/search?q=${encodeURIComponent(query)}`,
          10000
        );

        if (!res.ok) {
          throw new Error(`Jamendo API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.results && data.results.length > 0) {
          console.log("✅ Jamendo search successful!");
          setJamendoResults(data.results);
          setActiveTab("jamendo");
        } else {
          setError("No results found on Jamendo. Try a different search.");
        }
      } catch (err) {
        console.error("❌ Jamendo search failed:", err.message);
        setError("Failed to search Jamendo. Please try again.");
      }
    }

    setLoading(false);
  }

  // Manual source toggle
  function handleSourceChange(newTab) {
    setActiveTab(newTab);
    setIsFallback(false);
    setError(null);
  }

  // Quick search suggestions
  const quickSearches = {
    youtube: [
      "Coke Studio",
      "Arijit Singh",
      "Atif Aslam",
      "AR Rahman",
      "Bollywood Hits",
    ],
    jamendo: ["Lo-fi Beats", "Jazz", "Acoustic", "Electronic", "Classical"],
  };

  useEffect(() => {
    searchMusic();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Music Player
            </span>
          </h1>
          <p className="text-neutral-400 text-sm">
            Discover and play your favorite music
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8 space-y-4">
          {/* Fallback Notification */}
          {isFallback && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-500 mb-1">
                  YouTube Unavailable
                </h3>
                <p className="text-sm text-amber-200/80">
                  YouTube appears to be blocked or unavailable. Showing
                  open-licensed music from Jamendo instead.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-500 mb-1">Error</h3>
                <p className="text-sm text-red-200/80">{error}</p>
              </div>
            </div>
          )}

          {/* Search Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchMode("single");
                  handleSourceChange("youtube");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  searchMode === "single"
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                Single Search
              </button>
              <button
                onClick={() => setSearchMode("dual")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  searchMode === "dual"
                    ? "bg-white text-black"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                🔥 Search Both
              </button>
            </div>
          </div>

          {/* Source Tabs (only show in single mode) */}
          {searchMode === "single" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSourceChange("youtube")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "youtube"
                    ? "bg-red-600 text-white"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </button>
              <button
                onClick={() => handleSourceChange("jamendo")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "jamendo"
                    ? "bg-orange-600 text-white"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                Jamendo
              </button>
            </div>
          )}

          {/* Result Tabs (show in dual mode) */}
          {searchMode === "dual" &&
            (youtubeResults.length > 0 || jamendoResults.length > 0) && (
              <div className="flex gap-2 border-b border-neutral-800">
                <button
                  onClick={() => setActiveTab("youtube")}
                  className={`px-4 py-3 font-medium transition-all border-b-2 ${
                    activeTab === "youtube"
                      ? "border-red-600 text-white"
                      : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  YouTube ({youtubeResults.length})
                </button>
                <button
                  onClick={() => setActiveTab("jamendo")}
                  className={`px-4 py-3 font-medium transition-all border-b-2 ${
                    activeTab === "jamendo"
                      ? "border-orange-600 text-white"
                      : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  Jamendo ({jamendoResults.length})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-3 font-medium transition-all border-b-2 ${
                    activeTab === "all"
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  All ({youtubeResults.length + jamendoResults.length})
                </button>
              </div>
            )}

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-neutral-500"
                placeholder="Search for songs, artists, or albums..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMusic(source)}
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={() => searchMusic(activeTab)}
              disabled={loading}
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Searching..."
                : searchMode === "dual"
                ? "Search Both"
                : "Search"}
            </button>
          </div>

          {/* Quick Search Suggestions */}
          {!loading && getCurrentResults().length === 0 && (
            <div className="space-y-3">
              {searchMode === "single" && (
                <>
                  <p className="text-sm text-neutral-500">
                    Popular searches on{" "}
                    {activeTab === "youtube" ? "YouTube" : "Jamendo"}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickSearches[activeTab].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          setTimeout(() => searchMusic(activeTab), 100);
                        }}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-sm rounded-full transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Now Playing */}
        {current && (
          <div className="mb-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold">Now Playing</h2>
            </div>

            <div className="bg-black rounded-lg overflow-hidden mb-4">
              {current.source === "youtube" ? (
                <YouTube
                  videoId={current.id}
                  opts={{
                    width: "100%",
                    height: "400",
                    playerVars: { autoplay: 1 },
                  }}
                />
              ) : (
                <div className="p-6">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={current.artwork}
                      alt={current.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">
                        {current.title}
                      </h3>
                      <p className="text-neutral-400">{current.artist}</p>
                    </div>
                  </div>
                  <audio controls className="w-full" autoPlay>
                    <source src={current.streamUrl} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>

            <div className="text-sm text-neutral-400">
              <p className="font-semibold text-white">{current.title}</p>
              <p>{current.channel || current.artist}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-400">Searching for music...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && getCurrentResults().length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {activeTab === "all"
                  ? `All Results (${getCurrentResults().length})`
                  : `${
                      activeTab === "youtube" ? "YouTube" : "Jamendo"
                    } Results (${getCurrentResults().length})`}
              </h2>
              {searchMode === "dual" && (
                <div className="text-sm text-neutral-500">
                  Showing {activeTab === "all" ? "both platforms" : activeTab}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              {getCurrentResults().map((song, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(song)}
                  className={`flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:bg-neutral-800 hover:border-neutral-700 transition-all group ${
                    current?.id === song.id ? "ring-2 ring-white" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={song.thumbnail || song.artwork}
                      alt={song.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-white transition line-clamp-1">
                        {song.title}
                      </h3>
                      {activeTab === "all" && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            song.source === "youtube"
                              ? "bg-red-600/20 text-red-400"
                              : "bg-orange-600/20 text-orange-400"
                          }`}
                        >
                          {song.source === "youtube" ? "YT" : "JM"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">
                      {song.channel || song.artist}
                    </p>
                  </div>

                  {current?.id === song.id && (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Playing
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          getCurrentResults().length === 0 &&
          youtubeResults.length === 0 &&
          jamendoResults.length === 0 &&
          !error && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-neutral-700 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <h3 className="text-lg font-semibold text-neutral-400 mb-2">
                {searchMode === "dual"
                  ? "Search both platforms"
                  : "Start searching"}
              </h3>
              <p className="text-neutral-500">
                {searchMode === "dual"
                  ? "Get results from YouTube and Jamendo simultaneously"
                  : "Try the suggestions above or search for your favorite music"}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
