import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { prisma } from "../config/db.js";
import { generateRandomPassword } from "../utils/helpers.js";
import { deleteStoredMedia } from "./objectStorage.js";

/**
 * Billing-safe account deletion shared by the admin panel and the
 * self-service "delete my account" flow.
 *
 * A hard delete is not an option: invoices and subscription events must be
 * retained for tax/accounting, and Stripe reconciliation must never re-adopt
 * the old subscription for a later sign-up that reuses the email. So we:
 *   1. cancel the live subscription,
 *   2. anonymize (but keep) the Stripe customer,
 *   3. erase personal activity records,
 *   4. soft-delete the user row, tombstoning the unique email/username and
 *      replacing the password with an unusable hash,
 *   5. delete uploaded media,
 *   6. write an audit event.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const ACCOUNT_DELETE_SOURCES = {
  SELF: "self_service",
  ADMIN: "admin",
};

const anonymizeStripeCustomer = async (user, deletedBy) => {
  if (!user.stripeCustomerId) return;
  try {
    await stripe.customers.update(user.stripeCustomerId, {
      email: `deleted+${user.id}@exegesis.invalid`,
      name: "Deleted user",
      metadata: { userId: "", deleted: "true", deletedBy: String(deletedBy) },
    });
  } catch (stripeErr) {
    console.warn(
      `[AccountDeletion] Could not anonymize Stripe customer ${user.stripeCustomerId} for ${user.email}:`,
      stripeErr.message,
    );
  }
};

const cancelStripeSubscription = async (user) => {
  if (!user.stripeSubscriptionId) return;
  try {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
  } catch (stripeErr) {
    // Already cancelled or missing on Stripe — safe to continue.
    console.warn(
      `[AccountDeletion] Could not cancel subscription ${user.stripeSubscriptionId} for ${user.email}:`,
      stripeErr.message,
    );
  }
};

/**
 * @param {object} params
 * @param {object} params.user - The full user row (must include id, email,
 *   username, subscription and photo columns).
 * @param {string} [params.deletedBy] - User id that triggered the deletion.
 * @param {string} [params.source] - One of ACCOUNT_DELETE_SOURCES.
 * @returns {Promise<{status: number, message: string}>}
 */
export const deleteUserAccount = async ({
  user,
  deletedBy = user.id,
  source = ACCOUNT_DELETE_SOURCES.SELF,
}) => {
  await cancelStripeSubscription(user);
  await anonymizeStripeCustomer(user, deletedBy);

  // Clean up personal content and activity (no billing value). This includes
  // the journals the in-app deletion notice promises to erase, plus everything
  // else that carries the person's words or device identifiers.
  await prisma.journalLike.deleteMany({ where: { userId: user.id } });
  await prisma.exegesisSession.deleteMany({ where: { userId: user.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } });
  await prisma.triviaAnswer.deleteMany({ where: { userId: user.id } });
  await prisma.popularSearchLog.deleteMany({ where: { userId: user.id } });
  await prisma.pushToken.deleteMany({ where: { userId: user.id } });
  await prisma.pushSetting.deleteMany({ where: { userId: user.id } });
  await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
  await prisma.activity.deleteMany({ where: { userId: user.id } });
  await prisma.highlight.deleteMany({ where: { createdBy: user.id } });
  await prisma.favorite.deleteMany({ where: { createdBy: user.id } });
  await prisma.note.deleteMany({ where: { createdBy: user.id } });
  await prisma.readHistory.deleteMany({ where: { createdBy: user.id } });
  await prisma.userQuizAnswer.deleteMany({ where: { userId: user.id } });
  await prisma.userPlanProgress.deleteMany({ where: { userId: user.id } });
  await prisma.verification.deleteMany({ where: { createdBy: user.id } });
  await prisma.message.deleteMany({ where: { createdBy: user.id } });
  await prisma.dailyVerse.deleteMany({ where: { createdBy: user.id } });

  // Keep the row so billing events keep a valid foreign key, but free the
  // unique email/username so the person can register a fresh account.
  const unusablePassword = await bcrypt.hash(generateRandomPassword(24), 10);
  await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      accountStatus: "deleted",
      status: false,
      deletedAt: new Date(),
      deletedEmail: user.email,
      email: `deleted+${user.id}@exegesis.invalid`,
      username: `deleted_${user.id}`,
      password: unusablePassword,
      sessionId: null,
      isLoggedIn: false,
      subscriptionTier: "free",
      accessExpiresAt: null,
      stripeSubscriptionId: null,
      profilePhotoUrl: null,
      coverPhotoUrl: null,
    },
  });

  const mediaResults = await Promise.allSettled([
    deleteStoredMedia(user.profilePhotoUrl),
    deleteStoredMedia(user.coverPhotoUrl),
  ]);
  for (const result of mediaResults) {
    if (result.status === "rejected") {
      console.error("Failed to delete media for deleted account:", result.reason);
    }
  }

  // Record the cancellation for the audit trail.
  await prisma.subscriptionEvent.create({
    data: {
      userId: user.id,
      eventType: "cancelled",
      tier: "free",
      stripeEventId: user.stripeSubscriptionId || null,
      metadata: {
        action: "account_deleted",
        source,
        previousTier: user.subscriptionTier,
        deletedBy,
      },
    },
  });

  return {
    status: 200,
    message:
      "User account deleted. Subscription cancelled and billing history retained.",
  };
};
