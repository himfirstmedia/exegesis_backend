import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import * as adminService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getUsersByAdmin = async (req, res) => {
  try {
    const result = await adminService.getUsersByAdmin(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get users by admin error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching users: " + error.message,
        }),
      );
  }
};

export const updateUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log(
      "updateUser - adminId type:",
      typeof adminId,
      "value:",
      adminId,
    );
    const bodyStr = JSON.stringify(req.body, (k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
    console.log("updateUser - body:", bodyStr);
    const result = await adminService.updateUser(req.body, adminId);
    console.log(
      "updateUser result - status:",
      result.status,
      "message:",
      result.message,
      "hasData:",
      !!result.data,
    );
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Update user error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error updating user: " + errorMsg,
        }),
      );
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Delete user error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error deleting user: " + error.message,
        }),
      );
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const result = await adminService.toggleUserStatus(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error toggling user status: " + error.message,
        }),
      );
  }
};

export const toggleUserVerification = async (req, res) => {
  try {
    const result = await adminService.toggleUserVerification(
      req.body,
      req.user.id,
    );
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Toggle user verification error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error toggling user verification: " + error.message,
        }),
      );
  }
};

export const createUser = async (req, res) => {
  try {
    const result = await adminService.createUser(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Create user error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error creating user: " + error.message,
        }),
      );
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const result = await adminService.getAdminDashboardStats();
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching dashboard stats: " + error.message,
        }),
      );
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const result = await adminService.getUserActivity(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get user activity error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching user activity: " + error.message,
        }),
      );
  }
};

export const getAllActivity = async (req, res) => {
  try {
    const result = await adminService.getAllActivity(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get all activity error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching activity: " + error.message,
        }),
      );
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const result = await adminService.deleteActivity(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Delete activity error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error deleting activity: " + error.message,
        }),
      );
  }
};

export const addDailyVerse = async (req, res) => {
  try {
    const result = await adminService.addDailyVerse(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Add daily verse error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error adding daily verse: " + error.message,
        }),
      );
  }
};

export const getAllDailyVerses = async (req, res) => {
  try {
    const result = await adminService.getAllDailyVerses(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get all daily verses error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching daily verses: " + error.message,
        }),
      );
  }
};

export const deleteDailyVerse = async (req, res) => {
  try {
    const result = await adminService.deleteDailyVerse(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Delete daily verse error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error deleting daily verse: " + error.message,
        }),
      );
  }
};

export const addDailyDevotion = async (req, res) => {
  try {
    const result = await adminService.addDailyDevotion(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Add daily devotion error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error adding daily devotion: " + error.message,
        }),
      );
  }
};

export const getAllDailyDevotions = async (req, res) => {
  try {
    const result = await adminService.getAllDailyDevotions(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get all daily devotions error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching daily devotions: " + error.message,
        }),
      );
  }
};

export const getSiteSetting = async (req, res) => {
  try {
    const result = await adminService.getSiteSetting(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get site setting error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching setting: " + error.message,
        }),
      );
  }
};

export const setSiteSetting = async (req, res) => {
  try {
    const result = await adminService.setSiteSetting(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Set site setting error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error saving setting: " + error.message,
        }),
      );
  }
};

export const deleteDailyDevotion = async (req, res) => {
  try {
    const result = await adminService.deleteDailyDevotion(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Delete daily devotion error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error deleting daily devotion: " + error.message,
        }),
      );
  }
};

export const addDailyExegesis = async (req, res) => {
  try {
    const result = await adminService.addDailyExegesis(req.body, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Add daily exegesis error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error adding daily exegesis: " + error.message,
        }),
      );
  }
};

export const getAllDailyExegesis = async (req, res) => {
  try {
    const result = await adminService.getAllDailyExegesis(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Get all daily exegesis error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error fetching daily exegesis: " + error.message,
        }),
      );
  }
};

export const deleteDailyExegesis = async (req, res) => {
  try {
    const result = await adminService.deleteDailyExegesis(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("Delete daily exegesis error:", error);
    return res
      .status(500)
      .json(
        formatApiResponse({
          status: 500,
          message: "Error deleting daily exegesis: " + error.message,
        }),
      );
  }
};

// ─── Subscribed Users (Stripe + DB cross-reference) ─────────────────────────

/**
 * Resolve a Stripe price ID → internal tier ID.
 *
 * Strategy (no deep expand needed):
 * 1. Match stripePriceId against SubscriptionTier table (fastest, covers all seeded tiers).
 * 2. If not found, retrieve the Price from Stripe (single API call) and check its
 *    product metadata for a tierId.
 * 3. Last resort: slugify product name + append interval suffix.
 */
const resolveTierFromPriceId = async (priceId, interval) => {
  if (!priceId) return null;

  // 1. DB lookup — O(1), no Stripe call needed in the common case
  const tier = await prisma.subscriptionTier.findFirst({
    where: { stripePriceId: priceId },
  });
  if (tier) return tier.id;

  // 2. Fetch just the Price object (2 levels: price.product) — within Stripe limits
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
    const product = price.product;
    if (product && typeof product === "object") {
      if (product.metadata?.tierId) return product.metadata.tierId;
      const slug = product.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      if (slug) return interval === "month" ? `${slug}_monthly` : slug;
    }
  } catch { /* non-fatal */ }

  return null;
};

/**
 * Fetch all active Stripe subscriptions, expanding only customer + price
 * (both at 3 levels deep — well within Stripe's 4-level limit).
 */
const fetchAllStripeSubscriptions = async () => {
  const subs = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      // customer → 2 levels, items.data.price → 4 levels (data.customer & data.items.data.price)
      expand: ["data.customer", "data.items.data.price"],
      ...(startingAfter && { starting_after: startingAfter }),
    });
    subs.push(...page.data);
    hasMore = page.has_more;
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id;
  }

  return subs;
};

export const getSubscribedUsers = async (req, res) => {
  try {
    // ── 1. Fetch all active Stripe subscriptions ──────────────────────────
    const stripeSubscriptions = await fetchAllStripeSubscriptions();

    // ── 2. Build a map: stripeCustomerId → enriched info ─────────────────
    const stripeByCustomer = new Map();
    for (const sub of stripeSubscriptions) {
      const customer = sub.customer;
      const customerId = typeof customer === "object" ? customer.id : customer;
      const email = typeof customer === "object" ? customer.email : null;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
      const tierId = await resolveTierFromPriceId(priceId, interval);

      stripeByCustomer.set(customerId, {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerId,
        stripeEmail: email,
        stripeTier: tierId,
        stripeStatus: sub.status,
        stripeCurrentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        accessExpiresAt: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
      });
    }

    // ── 3. Fetch all relevant DB users ────────────────────────────────────
    const dbUsers = await prisma.systemUser.findMany({
      where: {
        OR: [
          { subscriptionTier: { not: "free" } },
          { stripeCustomerId: { not: null } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subscriptionTier: true,
        accessExpiresAt: true,
        legacySowerSlot: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        accountStatus: true,
        createdOn: true,
      },
      orderBy: { createdOn: "desc" },
    });

    // ── 4. Auto-sync: update DB users whose Stripe data differs ──────────
    const syncPromises = [];
    for (const u of dbUsers) {
      const stripeData = u.stripeCustomerId ? stripeByCustomer.get(u.stripeCustomerId) : null;
      if (!stripeData) continue;

      const needsTierUpdate = stripeData.stripeTier && stripeData.stripeTier !== u.subscriptionTier;
      const needsSubIdUpdate = stripeData.stripeSubscriptionId && stripeData.stripeSubscriptionId !== u.stripeSubscriptionId;
      const needsExpiryUpdate = stripeData.accessExpiresAt && (
        !u.accessExpiresAt ||
        Math.abs(new Date(u.accessExpiresAt).getTime() - stripeData.accessExpiresAt.getTime()) > 60_000
      );

      if (needsTierUpdate || needsSubIdUpdate || needsExpiryUpdate) {
        const previousTier = u.subscriptionTier;
        syncPromises.push(
          prisma.systemUser.update({
            where: { id: u.id },
            data: {
              ...(needsSubIdUpdate && { stripeSubscriptionId: stripeData.stripeSubscriptionId }),
              ...(needsTierUpdate && { subscriptionTier: stripeData.stripeTier }),
              ...(needsExpiryUpdate && { accessExpiresAt: stripeData.accessExpiresAt }),
            },
          }).then(async () => {
            if (needsTierUpdate) {
              await prisma.subscriptionEvent.create({
                data: {
                  userId: u.id,
                  eventType: "upgraded",
                  tier: stripeData.stripeTier,
                  stripeEventId: stripeData.stripeSubscriptionId,
                  metadata: { action: "auto_sync_on_load", previousTier },
                },
              }).catch(() => {}); // non-fatal
            }
            // Update in-memory so the response reflects the fix immediately
            u.subscriptionTier = stripeData.stripeTier || u.subscriptionTier;
            u.stripeSubscriptionId = stripeData.stripeSubscriptionId;
            u.accessExpiresAt = stripeData.accessExpiresAt;
          })
        );
      }
    }
    // Run all DB updates in parallel, don't let failures block the response
    await Promise.allSettled(syncPromises);

    // ── 5. Build response — merged DB + Stripe data ───────────────────────
    const dbCustomerIds = new Set(dbUsers.map((u) => u.stripeCustomerId).filter(Boolean));

    const mergedUsers = dbUsers.map((u) => {
      const stripeData = u.stripeCustomerId ? stripeByCustomer.get(u.stripeCustomerId) : null;
      const syncIssue = stripeData
        ? stripeData.stripeTier && stripeData.stripeTier !== u.subscriptionTier
          ? `DB tier "${u.subscriptionTier}" ≠ Stripe tier "${stripeData.stripeTier}"`
          : null
        : u.subscriptionTier !== "free"
        ? "Active in DB but no Stripe subscription found"
        : null;

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        subscriptionTier: u.subscriptionTier,
        accessExpiresAt: u.accessExpiresAt
          ? (u.accessExpiresAt instanceof Date ? u.accessExpiresAt.toISOString() : u.accessExpiresAt)
          : null,
        legacySowerSlot: u.legacySowerSlot,
        isSuspended: u.accountStatus === "suspended",
        createdOn: u.createdOn instanceof Date ? u.createdOn.toISOString() : u.createdOn,
        stripeCustomerId: u.stripeCustomerId,
        stripeSubscriptionId: stripeData?.stripeSubscriptionId || u.stripeSubscriptionId,
        stripeTier: stripeData?.stripeTier || null,
        stripeStatus: stripeData?.stripeStatus || null,
        stripeCurrentPeriodEnd: stripeData?.stripeCurrentPeriodEnd || null,
        source: "db",
        syncIssue,
        outOfSync: !!syncIssue,
      };
    });

    // ── 6. Surface Stripe-only subs (no matching DB customer) ─────────────
    const stripeOnlyUsers = [];
    for (const [customerId, stripeData] of stripeByCustomer.entries()) {
      if (dbCustomerIds.has(customerId)) continue;

      // Try email match
      const dbMatch = stripeData.stripeEmail
        ? await prisma.systemUser.findUnique({ where: { email: stripeData.stripeEmail } })
        : null;

      // Auto-link if email matched but customer ID wasn't stored
      if (dbMatch && !dbMatch.stripeCustomerId) {
        await prisma.systemUser.update({
          where: { id: dbMatch.id },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: stripeData.stripeSubscriptionId,
            ...(stripeData.stripeTier && { subscriptionTier: stripeData.stripeTier }),
            ...(stripeData.accessExpiresAt && { accessExpiresAt: stripeData.accessExpiresAt }),
          },
        }).catch(() => {}); // non-fatal
      }

      stripeOnlyUsers.push({
        id: dbMatch?.id || null,
        firstName: dbMatch?.firstName || null,
        lastName: dbMatch?.lastName || null,
        email: stripeData.stripeEmail,
        subscriptionTier: stripeData.stripeTier || dbMatch?.subscriptionTier || "unknown",
        accessExpiresAt: stripeData.stripeCurrentPeriodEnd,
        legacySowerSlot: dbMatch?.legacySowerSlot || null,
        isSuspended: false,
        createdOn: null,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeData.stripeSubscriptionId,
        stripeTier: stripeData.stripeTier,
        stripeStatus: stripeData.stripeStatus,
        stripeCurrentPeriodEnd: stripeData.stripeCurrentPeriodEnd,
        source: dbMatch ? "partial" : "stripe_only",
        syncIssue: dbMatch
          ? `Auto-linked: ${stripeData.stripeEmail} (was missing stripeCustomerId)`
          : `Paid Stripe subscriber not in DB: ${stripeData.stripeEmail}`,
        outOfSync: !dbMatch, // partial ones got auto-fixed above
      });
    }

    const allUsers = [...mergedUsers, ...stripeOnlyUsers].filter(
      (u) => u.subscriptionTier !== "free" || u.source !== "db" || u.stripeStatus === "active"
    );

    const summary = {
      totalInDB: dbUsers.filter((u) => u.subscriptionTier !== "free").length,
      totalInStripe: stripeSubscriptions.length,
      outOfSync: allUsers.filter((u) => u.outOfSync).length,
      stripeOnly: stripeOnlyUsers.filter((u) => u.source === "stripe_only").length,
      autoSynced: syncPromises.length,
    };

    return res.json(formatApiResponse({
      status: 200,
      message: `Subscribed users retrieved. Auto-synced ${syncPromises.length} record(s).`,
      data: { subscribedUsers: allUsers, summary },
    }));
  } catch (error) {
    console.error("[AdminController] getSubscribedUsers error:", error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: "Failed to retrieve subscribed users: " + error.message,
    }));
  }
};

/**
 * Manual full sync: reconcile all active Stripe subscribers into the DB.
 */
export const syncStripeSubscribers = async (req, res) => {
  try {
    const results = { linked: [], updated: [], notFound: [], alreadyInSync: [] };

    const stripeSubscriptions = await fetchAllStripeSubscriptions();

    for (const sub of stripeSubscriptions) {
      const customer = sub.customer;
      const customerId = typeof customer === "object" ? customer.id : customer;
      const email = typeof customer === "object" ? customer.email : null;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
      const tierId = await resolveTierFromPriceId(priceId, interval);
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null;

      if (!email) continue;

      // Find user by stripeCustomerId first, then by email
      let user = await prisma.systemUser.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) user = await prisma.systemUser.findUnique({ where: { email } });

      if (!user) {
        results.notFound.push({ email, customerId, tierId });
        continue;
      }

      const needsLink = !user.stripeCustomerId || user.stripeCustomerId !== customerId;
      const needsTierUpdate = tierId && user.subscriptionTier !== tierId;
      const needsSubIdUpdate = !user.stripeSubscriptionId || user.stripeSubscriptionId !== sub.id;

      if (!needsLink && !needsTierUpdate && !needsSubIdUpdate) {
        results.alreadyInSync.push({ email, tierId });
        continue;
      }

      const previousTier = user.subscriptionTier;
      await prisma.systemUser.update({
        where: { id: user.id },
        data: {
          ...(needsLink && { stripeCustomerId: customerId }),
          ...(needsSubIdUpdate && { stripeSubscriptionId: sub.id }),
          ...(needsTierUpdate && tierId && {
            subscriptionTier: tierId,
            accessExpiresAt: periodEnd,
          }),
        },
      });

      if (needsTierUpdate && tierId) {
        await prisma.subscriptionEvent.create({
          data: {
            userId: user.id,
            eventType: "upgraded",
            tier: tierId,
            stripeEventId: sub.id,
            metadata: { action: "stripe_sync", previousTier, syncedBy: req.user.id },
          },
        });
      }

      if (needsLink) results.linked.push({ email, customerId });
      if (needsTierUpdate) results.updated.push({ email, from: previousTier, to: tierId });
    }

    return res.json(formatApiResponse({
      status: 200,
      message: `Sync complete. ${results.updated.length} tiers updated, ${results.linked.length} accounts linked.`,
      data: { results },
    }));
  } catch (error) {
    console.error("[AdminController] syncStripeSubscribers error:", error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: "Sync failed: " + error.message,
    }));
  }
};

// ─── Subscription Tier CRUD ─────────────────────────────────────────────────

const toCents = (amount) => Math.round(parseFloat(amount) * 100);

const createStripeProductAndPrice = async (id, name, price, interval) => {
  if (interval === "none") return { stripeProductId: null, stripePriceId: null };

  const product = await stripe.products.create({
    name,
    metadata: { tierId: id },
  });

  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: toCents(price),
    currency: "usd",
    recurring: interval === "month" ? { interval: "month" } : { interval: "year" },
    metadata: { tier: id },
  });

  return { stripeProductId: product.id, stripePriceId: stripePrice.id };
};

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export const createSubscriptionTier = async (req, res) => {
  try {
    const { name, description, price, currency, interval, features, isActive, sortOrder, maxSlots } = req.body;

    if (!name) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "name is required" }));
    }

    // Auto-generate id from name
    let id = slugify(name);
    // Append interval suffix if not already present and not "none"
    if (interval && interval !== "none" && !id.endsWith("_" + interval)) {
      id = id + "_" + interval;
    }

    // If id exists, append a counter
    let finalId = id;
    let counter = 1;
    while (await prisma.subscriptionTier.findUnique({ where: { id: finalId } })) {
      finalId = id + "_" + counter;
      counter++;
    }

    // Auto-create Stripe product + price
    const { stripeProductId, stripePriceId } = await createStripeProductAndPrice(finalId, name, price, interval || "year");

    const tier = await prisma.subscriptionTier.create({
      data: {
        id: finalId,
        name,
        description,
        price: price ?? 0,
        currency: currency || "usd",
        interval: interval || "year",
        stripeProductId,
        stripePriceId,
        features: features || [],
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        maxSlots,
      },
    });

    return res.status(201).json(formatApiResponse({
      status: 200,
      message: "Subscription tier created",
      data: tier,
    }));
  } catch (error) {
    console.error("Create subscription tier error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const updateSubscriptionTier = async (req, res) => {
  try {
    const { id, name, description, price, currency, interval, features, isActive, sortOrder, maxSlots } = req.body;

    if (!id) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "id is required" }));
    }

    const existing = await prisma.subscriptionTier.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "Tier not found" }));
    }

    // Sync Stripe product name
    if (name !== undefined && name !== existing.name && existing.interval !== "none") {
      const productId = existing.stripeProductId;
      if (productId) {
        await stripe.products.update(productId, { name });
      }
    }

    // If price or interval changed, create a new Stripe price
    let stripePriceId = existing.stripePriceId;
    const priceChanged = price !== undefined && price !== existing.price;
    const intervalChanged = interval !== undefined && interval !== existing.interval;
    if ((priceChanged || intervalChanged) && existing.interval !== "none") {
      const newPrice = await stripe.prices.create({
        product: existing.stripeProductId,
        unit_amount: toCents(price ?? existing.price),
        currency: "usd",
        recurring: { interval: (interval || existing.interval) === "month" ? "month" : "year" },
        metadata: { tier: id },
      });
      stripePriceId = newPrice.id;
    }

    const tier = await prisma.subscriptionTier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(interval !== undefined && { interval }),
        ...(stripePriceId !== undefined && { stripePriceId }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(maxSlots !== undefined && { maxSlots }),
      },
    });

    return res.json(formatApiResponse({
      status: 200,
      message: "Subscription tier updated",
      data: tier,
    }));
  } catch (error) {
    console.error("Update subscription tier error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const deleteSubscriptionTier = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "id is required" }));
    }

    await prisma.subscriptionTier.delete({ where: { id } });

    return res.json(formatApiResponse({
      status: 200,
      message: "Subscription tier deleted",
    }));
  } catch (error) {
    console.error("Delete subscription tier error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const syncStripeTiers = async (req, res) => {
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    const results = [];

    for (const product of products.data) {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      });

      for (const price of prices.data) {
        const tierId = product.metadata?.tierId || product.name.toLowerCase().replace(/\s+/g, "_");
        const interval = price.recurring?.interval || "year";
        const priceAmount = price.unit_amount / 100;

        const data = {
          name: product.name,
          price: priceAmount,
          currency: price.currency,
          interval,
          stripeProductId: product.id,
          stripePriceId: price.id,
          isActive: true,
        };

        const existing = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
        if (existing) {
          await prisma.subscriptionTier.update({ where: { id: tierId }, data });
          results.push({ action: "updated", id: tierId, priceId: price.id });
        } else {
          await prisma.subscriptionTier.create({ data: { id: tierId, ...data, sortOrder: 0 } });
          results.push({ action: "created", id: tierId, priceId: price.id });
        }
      }
    }

    return res.json(formatApiResponse({
      status: 200,
      message: "Stripe tiers synced",
      data: { results },
    }));
  } catch (error) {
    console.error("Sync Stripe tiers error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

const DEFAULT_TIERS = [
  { id: "free", name: "Free Reader", price: 0, interval: "none", sortOrder: 0, maxSlots: null, features: ["Bible reading", "Daily verse", "Basic tools"] },
  { id: "legacy_sower", name: "Legacy Sower", price: 33.33, interval: "year", sortOrder: 1, maxSlots: 1000, features: ["Full Legacy Ledger and study tools"] },
  { id: "covenant_sower", name: "Covenant Sower", price: 77.77, interval: "year", sortOrder: 2, maxSlots: null, features: ["Full access and future modules"] },
];

export const seedSubscriptionTiers = async (req, res) => {
  try {
    const results = [];
    for (const tier of DEFAULT_TIERS) {
      const existing = await prisma.subscriptionTier.findUnique({ where: { id: tier.id } });
      if (!existing) {
        // Auto-create Stripe product + price (skip free/none intervals)
        const { stripeProductId, stripePriceId } = tier.interval !== "none"
          ? await createStripeProductAndPrice(tier.id, tier.name, tier.price, tier.interval)
          : { stripeProductId: null, stripePriceId: null };

        const created = await prisma.subscriptionTier.create({
          data: { ...tier, stripeProductId, stripePriceId },
        });
        results.push({ action: "created", id: created.id, priceId: stripePriceId });
      } else {
        results.push({ action: "skipped", id: tier.id });
      }
    }
    return res.json(formatApiResponse({
      status: 200,
      message: "Default tiers seeded",
      data: { results },
    }));
  } catch (error) {
    console.error("Seed subscription tiers error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const listSubscriptionTiers = async (req, res) => {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return res.json(formatApiResponse({
      status: 200,
      message: "Subscription tiers retrieved",
      data: { tiers },
    }));
  } catch (error) {
    console.error("List subscription tiers error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

// ─── User Subscription Management ───────────────────────────────────────────

export const updateUserSubscription = async (req, res) => {
  try {
    const { userId, subscriptionTier, accessExpiresAt, accountStatus } = req.body;

    if (!userId || !subscriptionTier) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "userId and subscriptionTier are required" }));
    }

    const user = await prisma.systemUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    const updated = await prisma.systemUser.update({
      where: { id: userId },
      data: {
        subscriptionTier,
        ...(accessExpiresAt !== undefined && { accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null }),
        ...(accountStatus !== undefined && { accountStatus }),
      },
    });

    await prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType: "upgraded",
        tier: subscriptionTier,
        metadata: { updatedBy: req.user.id, previousTier: user.subscriptionTier },
      },
    });

    const { password, ...rest } = updated;
    return res.json(formatApiResponse({
      status: 200,
      message: "User subscription updated",
      data: { user: { ...rest, password: null } },
    }));
  } catch (error) {
    console.error("Update user subscription error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const suspendUserSubscription = async (req, res) => {
  try {
    const { userId, suspend } = req.body;

    if (!userId) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "userId is required" }));
    }

    const user = await prisma.systemUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    const newStatus = suspend ? "suspended" : "active";

    const updated = await prisma.systemUser.update({
      where: { id: userId },
      data: { accountStatus: newStatus },
    });

    await prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType: suspend ? "cancelled" : "created",
        tier: user.subscriptionTier,
        metadata: { action: suspend ? "suspended" : "unsuspended", updatedBy: req.user.id },
      },
    });

    const { password, ...rest } = updated;
    return res.json(formatApiResponse({
      status: 200,
      message: suspend ? "User suspended" : "User unsuspended",
      data: { user: { ...rest, password: null } },
    }));
  } catch (error) {
    console.error("Suspend user subscription error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};

export const refundUserSubscription = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "userId is required" }));
    }

    const user = await prisma.systemUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "User has no active Stripe subscription to refund" }));
    }

    // Retrieve the Stripe subscription to get the latest invoice's payment intent
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const latestInvoice = subscription.latest_invoice;

    if (!latestInvoice) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "No invoice found for this subscription" }));
    }

    const invoice = await stripe.invoices.retrieve(latestInvoice);
    const paymentIntent = invoice.payment_intent;

    if (!paymentIntent) {
      return res.status(400).json(formatApiResponse({ status: 400, message: "No payment intent found for this invoice" }));
    }

    // Process the refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      reason: reason === "duplicate" ? "duplicate" : "requested_by_customer",
    });

    // Cancel the subscription
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Update user record
    await prisma.systemUser.update({
      where: { id: userId },
      data: {
        subscriptionTier: "free",
        stripeSubscriptionId: null,
        accessExpiresAt: null,
      },
    });

    await prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType: "cancelled",
        tier: "free",
        stripeEventId: refund.id,
        metadata: { action: "refunded", reason: reason || "requested_by_customer", refundId: refund.id, updatedBy: req.user.id },
      },
    });

    return res.json(formatApiResponse({
      status: 200,
      message: "Refund processed and subscription cancelled",
      data: { refund },
    }));
  } catch (error) {
    console.error("Refund user subscription error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: error.message }));
  }
};
