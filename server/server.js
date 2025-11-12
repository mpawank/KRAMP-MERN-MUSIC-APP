import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import pino from "pino";
import { Router } from "express";
import axios from "axios";
import { getCached, setCached } from "./cache.js";
import routes from "./routes.js";   // 👈 Important: this must be here

dotenv.config();

const log = pino({ transport: { target: "pino-pretty" } });
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Music API is running 🎵" });
});

// 👇 Mount the routes file
app.use("/api", routes);

const router = Router();

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "musicdb" });
    log.info("🎯 MongoDB connected successfully");

    const port = process.env.PORT || 5000;
    app.listen(port, () => log.info(`🎧 Server running on port ${port}`));
  } catch (err) {
    log.error(err, "❌ Failed to start server");
    process.exit(1);
  }
}

start();
