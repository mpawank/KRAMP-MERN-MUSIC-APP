import { Search } from "./models.js";

// Get cached result by query
export async function getCached(query, source) {
  try {
    const data = await Search.findOne({ query, source }).lean();
    return data;
  } catch (err) {
    console.error("Error reading cache:", err.message);
    return null;
  }
}

// Save result into cache
export async function setCached(query, source, results) {
  try {
    await Search.create({ query, source, results, createdAt: new Date() });
  } catch (err) {
    console.error("Error writing cache:", err.message);
  }
}

