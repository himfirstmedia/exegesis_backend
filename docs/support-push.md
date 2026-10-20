# Support push delivery

The daily verse uses a local phone alarm. Support replies require Firebase Cloud
Messaging from the backend, even when websocket chat and unread badges work.

1. Obtain a Firebase Admin service-account JSON for the same Firebase project as
   the Android/iOS app (currently `exegesis-bd116`). The app's
   `google-services.json` is **not** an Admin credential.
2. Keep the Admin JSON outside the repository. Set
   `GOOGLE_APPLICATION_CREDENTIALS=/secure/path/firebase-admin.json` and
   `FIREBASE_PROJECT_ID=exegesis-bd116` in the backend environment. Alternatively,
   use the secret environment variable `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. From `backend/`, run `node scripts/check-push-config.js`, then restart the
   backend. Repeat configuration on the production host if testing production.
4. Open the app, sign in, allow notifications, and call authenticated
   `POST /push/test`. Missing credentials, missing tokens and rejected sends now
   return errors, not a misleading successful send of zero notifications.
5. Send an admin reply while the phone app is backgrounded. Tap its notification
   to open the conversation. Support payloads also include
   `exegesis://support/<ticketId>?messageId=<messageId>`.

Normal FCM notification payloads are displayed by the OS when the app is closed.
Foreground websocket/FCM notifications share a message ID to avoid duplicates.
Android force-stop, revoked permission, or an offline phone can prevent delivery;
websockets/local reminders cannot bypass those restrictions for remote replies.
