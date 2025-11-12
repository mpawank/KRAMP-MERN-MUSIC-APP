
import mongoose from "mongoose";

// Define schema for cached searches
const SearchSchema = new mongoose.Schema({
  query: { type: String, required: true, index: true },
  source: { type: String, required: true }, // youtube, jamendo, etc.
  results: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now, index: true }
});

// TTL index -> automatically delete older cache (7 days)
SearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days = 604800s

export const Search = mongoose.model("Search", SearchSchema);
