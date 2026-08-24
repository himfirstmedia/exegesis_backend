import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import authRouter from "./modules/auth/route.js";
import adminRouter from "./modules/admin/route.js";
import bibleRouter from "./modules/bible/route.js";
import readingPlanRouter from "./modules/readingPlan/route.js";
import journalRouter from "./modules/journal/route.js";
import { formatApiResponse } from "./utils/helpers.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { absoluteMediaUrl } from "./middlewares/absoluteMediaUrl.middleware.js";
import { startEmailScheduler } from "./services/emailScheduler.js";
import { startPopularSearchCleanup } from "./services/popularSearchCleanup.js";
import translationRouter from "./modules/bible-translations/route.js"
import ttsRouter from "./modules/tts/route.js"
import { warmUpTTS } from "./modules/tts/service.js"
import strongsRouter from "./modules/strongs/route.js"
import exegesisRouter from "./modules/exegesis/route.js"
import triviaRouter from "./modules/trivia/route.js"
import studyToolsRouter from "./modules/study-tools/route.js"
import bookProloguesRouter from "./modules/book-prologues/route.js"
import verseResourcesRouter from "./modules/verse-resources/route.js"
import subscriptionsRouter from "./modules/subscriptions/routes.js"
import popularSearchesRouter from "./modules/popular-searches/route.js"
import aiRouter from "./modules/ai/route.js"
import textToTextTranslationRouter from "./modules/text-to-text-translation/route.js"
import { handleStripeWebhook } from "./modules/subscriptions/webhook.js"

config();
connectDB();

const app = express();

app.options("/{*path}", cors());

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:5001",
      "https://app.exegesisproject.org",
      "https://exegesisproject.org",
      process.env.CLIENT_URL,
      process.env.SITEGRROUND_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Larger body limit so base64 cover-photo uploads are accepted
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Serve uploaded cover photos (backend/uploads) at /uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rewrite relative /uploads/ media paths to absolute URLs in JSON responses so
// clients can render profilePhotoUrl / coverPhotoUrl directly. Must run before
// the route handlers so every response is transformed.
app.use(absoluteMediaUrl);

// Stripe webhook needs raw body for signature verification (must be BEFORE json parser)
app.use("/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/bible", bibleRouter);
app.use("/reading-plans", readingPlanRouter);
app.use("/journal", journalRouter);
app.use("/translations", translationRouter)
app.use("/tts", ttsRouter)
app.use("/strongs", strongsRouter)
app.use("/exegesis", exegesisRouter)
app.use("/trivia", triviaRouter)
app.use("/study-tools", studyToolsRouter)
app.use("/book-prologues", bookProloguesRouter)
app.use("/verse-resources", verseResourcesRouter)
app.use("/subscriptions", subscriptionsRouter)
app.use("/popular-searches", popularSearchesRouter)
app.use("/ai", aiRouter)
app.use("/translation", textToTextTranslationRouter)

app.get("/health", (req, res) => {
  res.send(
    formatApiResponse({
      status: 200,
      message: "Server is healthy",
      data: { timestamp: new Date().toISOString() },
    }),
  );
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Exegesis server running on port ${PORT}`);
  startEmailScheduler();
  startPopularSearchCleanup();
  // Pre-connect the Edge TTS sockets so the first voice request after boot
  // doesn't pay the ~2s WebSocket handshake.
  warmUpTTS();
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (error) => {
  // The msedge-tts library occasionally delivers a late metadata/audio frame
  // for a stream whose entry has already been removed, throwing inside its
  // WebSocket message handler. Our serialized pool makes this rare, but when it
  // does slip through it must not take down the whole server mid-playback.
  const isTtsStreamRace =
    error instanceof TypeError &&
    (error.message === "Cannot read properties of undefined (reading 'metadata')" ||
      error.message === "Cannot read properties of undefined (reading 'audio')");
  if (isTtsStreamRace) {
    console.warn("Ignored msedge-tts stream race:", error.message);
    return;
  }

  console.error("Uncaught Exception:", error);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

export default app;
