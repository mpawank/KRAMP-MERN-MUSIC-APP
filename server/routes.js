
import { Router } from "express";
import axios from "axios";
import { getCached, setCached } from "./cache.js";

const router = Router();

// 🔹 YouTube Search Route
router.get("/youtube/search", async (req, res) => {
  const query = req.query.q || "Coke Studio Pakistan";
  const source = "youtube";
  const cacheKey = `${source}:${query}`;

  // 1️⃣ Check cache
  const cached = await getCached(cacheKey, source);
  if (cached) return res.json({ results: cached.results, cached: true });

  try {
    const { data } = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: process.env.YOUTUBE_API_KEYS,
        q: query,
        part: "snippet",
        type: "video",
        maxResults: 15,
        videoCategoryId: "10"
      }
    });

    const results = (data.items || []).map(it => ({
      id: it.id.videoId,
      title: it.snippet.title,
      channel: it.snippet.channelTitle,
      thumbnail: it.snippet.thumbnails.medium.url,
      source: "youtube"
    }));

    // 2️⃣ Save to cache
    await setCached(cacheKey, source, results);
    res.json({ results, cached: false });
  } catch (err) {
    console.error("YouTube API Error:", err.message);
    res.status(500).json({ error: "YouTube fetch failed" });
  }
});

// 🔹 Jamendo Music Search Route
router.get("/jamendo/search", async (req, res) => {
  const query = req.query.q || "lofi";
  const source = "jamendo";
  const cacheKey = `${source}:${query}`;

  // 1️⃣ Check cache
  const cached = await getCached(cacheKey, source);
  if (cached) return res.json({ results: cached.results, cached: true });

  try {
    const { data } = await axios.get("https://api.jamendo.com/v3.0/tracks", {
      params: {
        client_id: process.env.JAMENDO_CLIENT_ID,
        format: "json",
        limit: 15,
        search: query,
        include: "licenses+musicinfo"
      }
    });

    const results = (data.results || []).map(t => ({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      artwork: t.image,
      streamUrl: t.audio,
      license: t.license_cc,
      source: "jamendo"
    }));

    // 2️⃣ Save to cache
    await setCached(cacheKey, source, results);
    res.json({ results, cached: false });
  } catch (err) {
    console.error("Jamendo API Error:", err.message);
    res.status(500).json({ error: "Jamendo fetch failed" });
  }
});

export default router;
