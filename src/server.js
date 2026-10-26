import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { config } from "dotenv";
import { connectDB, disconnectDB, prisma } from "./config/db.js";
import { corsOriginDelegate } from "./config/corsOrigins.js";
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
import { startPushScheduler } from "./services/pushNotificationScheduler.js";
import translationRouter from "./modules/bible-translations/route.js";
import ttsRouter from "./modules/tts/route.js";
import { warmUpTTS } from "./modules/tts/service.js";
import strongsRouter from "./modules/strongs/route.js";
import exegesisRouter from "./modules/exegesis/route.js";
import triviaRouter from "./modules/trivia/route.js";
import studyToolsRouter from "./modules/study-tools/route.js";
import bookProloguesRouter from "./modules/book-prologues/route.js";
import verseResourcesRouter from "./modules/verse-resources/route.js";
import subscriptionsRouter from "./modules/subscriptions/routes.js";
import popularSearchesRouter from "./modules/popular-searches/route.js";
import aiRouter from "./modules/ai/route.js";
import textToTextTranslationRouter from "./modules/text-to-text-translation/route.js";
import pushRouter from "./modules/push/route.js";
import { initializePushService } from "./modules/push/service.js";
import landingRouter from "./modules/landing/route.js";
import supportRouter from "./modules/support/route.js";
import readerStreamRouter from "./modules/reader-stream/route.js";
import { handleStripeWebhook } from "./modules/subscriptions/webhook.js";
import {
  getObjectStream,
  isMediaObjectKey,
  validateObjectStorageConfig,
} from "./services/objectStorage.js";
import {
  isPrivateMediaKey,
  verifyMediaSignature,
} from "./services/mediaSignature.js";
import { initRealtime } from "./realtime/index.js";

config();

// Fail fast on missing secrets rather than silently falling back to an
// insecure default. Tokens signed with a known default are forgeable.
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

try {
  validateObjectStorageConfig();
} catch (error) {
  console.error(`FATAL: ${error.message}`);
  process.exit(1);
}

// A production process holding a test-mode Stripe key accepts checkout
// sessions that never charge anyone. This cannot be validated at build time
// because the key lives in the deployment environment, so make it loud here.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
if (
  process.env.NODE_ENV === "production" &&
  stripeSecretKey.startsWith("sk_test_")
) {
  console.error(
    "WARNING: STRIPE_SECRET_KEY is a TEST key while NODE_ENV=production. " +
      "No real payment will be collected. Replace the key, the price IDs and " +
      "STRIPE_WEBHOOK_SECRET with live-mode values before launch.",
  );
}

initializePushService();

connectDB();

const app = express();

// Behind Railway's reverse proxy req.ip is the proxy unless we trust the
// first hop — required for rate limiting to key on the real client.
app.set("trust proxy", 1);

const corsOptions = {
  origin: corsOriginDelegate,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Preflight must use the same allow-list as the actual routes — a
// permissive OPTIONS handler would otherwise hand out the wildcard origin
// that the real CORS middleware is there to prevent.
app.options("/{*path}", cors(corsOptions));

app.use(cors(corsOptions));

// Stripe must receive the untouched request body for signature verification.
// Register this before the global JSON parser consumes req.body.
app.use(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Larger body limit so base64 cover-photo uploads are accepted
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Serve uploaded cover photos (backend/uploads) at /uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Proxy R2 objects that have no public bucket URL. Objects uploaded to R2 while
// R2_PUBLIC_BASE_URL is unset resolve to /media/<key>; this streams them back
// through the server without exposing bucket credentials.
app.get(/^\/media\/(.+)$/, async (req, res) => {
  const key = req.params[0];
  if (!isMediaObjectKey(key)) {
    return res.status(404).json({ status: 404, message: "Not found" });
  }

  // Support attachments are private: they may only be read with a valid,
  // unexpired signature that the API issued to the ticket's owner.
  const isPrivate = isPrivateMediaKey(key);
  if (isPrivate) {
    const { exp, sig } = req.query || {};
    if (!verifyMediaSignature(key, exp, sig)) {
      return res.status(403).json({ status: 403, message: "Media link is invalid or has expired" });
    }
  }

  try {
    const object = await getObjectStream(key);
    if (!object) return res.status(404).json({ status: 404, message: "Not found" });
    if (object.contentType) res.setHeader("Content-Type", object.contentType);
    if (object.contentLength !== undefined) {
      res.setHeader("Content-Length", object.contentLength);
    }
    // Private media must not be cached by shared caches; public media is
    // immutable because every key is a content-unique UUID.
    res.setHeader(
      "Cache-Control",
      isPrivate ? "private, max-age=300" : "public, max-age=2592000, immutable",
    );
    await pipeline(object.body, res);
  } catch (error) {
    console.error("Media proxy error:", error?.message || error);
    if (res.headersSent) {
      res.destroy();
      return;
    }
    const notFound =
      error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404;
    res.status(notFound ? 404 : 502).end();
  }
});

// Serve remaining static assets. Email branding is hosted on Cloudflare R2.
app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    immutable: true,
    maxAge: "30d",
  }),
);

// Rewrite relative /uploads/ media paths to absolute URLs in JSON responses so
// clients can render profilePhotoUrl / coverPhotoUrl directly. Must run before
// the route handlers so every response is transformed.
app.use(absoluteMediaUrl);

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/bible", bibleRouter);
app.use("/reading-plans", readingPlanRouter);
app.use("/journal", journalRouter);
app.use("/translations", translationRouter);
app.use("/tts", ttsRouter);
app.use("/strongs", strongsRouter);
app.use("/exegesis", exegesisRouter);
app.use("/trivia", triviaRouter);
app.use("/study-tools", studyToolsRouter);
app.use("/book-prologues", bookProloguesRouter);
app.use("/verse-resources", verseResourcesRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/popular-searches", popularSearchesRouter);
app.use("/ai", aiRouter);
app.use("/translation", textToTextTranslationRouter);
app.use("/push", pushRouter);
// Public landing-page data (daily verse, featured plans, tiers, stats).
app.use("/landing", landingRouter);
app.use("/support", supportRouter);
app.use("/reader", readerStreamRouter);

app.get("/health", async (req, res) => {
  // Report dependency health, not just process liveness: Railway restarts the
  // container on a non-2xx, and a booted process with a dead database cannot
  // serve a single request.
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.send(
      formatApiResponse({
        status: 200,
        message: "Server is healthy",
        data: {
          timestamp: new Date().toISOString(),
          database: "up",
        },
      }),
    );
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).send(
      formatApiResponse({
        status: 503,
        message: "Service unavailable",
        data: {
          timestamp: new Date().toISOString(),
          database: "down",
        },
      }),
    );
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Exegesis server running on port ${PORT}`);
  startEmailScheduler();
  startPopularSearchCleanup();
  startPushScheduler();
  // Pre-connect the Edge TTS sockets so the first voice request after boot
  // doesn't pay the ~2s WebSocket handshake.
  warmUpTTS();
});

initRealtime(server);

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
    (error.message ===
      "Cannot read properties of undefined (reading 'metadata')" ||
      error.message ===
        "Cannot read properties of undefined (reading 'audio')");
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
