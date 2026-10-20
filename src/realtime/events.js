// Realtime event names + room helpers.
//
// Kept dependency-free so both the Socket.IO server and the feature services
// (support, future features) can reference the exact same strings without
// importing Socket.IO itself. A typo in either side would silently break
// delivery, so names live in exactly one place.

export const REALTIME_EVENTS = {
  // Server → client
  supportMessage: "support:message",
  supportReceipt: "support:receipt",
  supportPresence: "support:presence",
  supportTicketUpdated: "support:ticket:updated",
  supportUnread: "support:unread",
  // Existing generic channel kept for the app's notification bridge.
  notificationNew: "notification:new",
};

export const userRoom = (userId) => `user:${String(userId)}`;

export const ADMIN_ROOM = "admins";
