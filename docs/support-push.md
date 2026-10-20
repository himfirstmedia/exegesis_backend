# Support push delivery

The daily verse uses a local phone alarm. Support replies require Firebase Cloud
Messaging from the backend, even when websocket chat and unread badges work.

See the [mobile manual](../../app/docs/APPLICATION_GUIDE.md#support),
[web admin manual](../../web/docs/APPLICATION_GUIDE.md#support-inbox-and-operational-parity)
and [backend manual](PLATFORM_GUIDE.md#support-message-push).

## Delivery paths and what they prove

```text
Admin reply -> persist message -> socket message/receipt/unread events
                            -> FCM send to ticket owner's registered devices
Phone foreground -> socket/FCM -> deduplicated local tray notification
Phone background/closed -> OS displays FCM notification -> tap opens conversation
```

Persistence, socket delivery, Firebase acceptance, OS notification display and
read acknowledgement are separate outcomes. A message check mark or Home/Profile
badge cannot establish closed-app push delivery. A native Daily Verse alarm can
work without any backend Firebase credential at all.

## Configure the correct server

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

Never paste an Admin JSON/private key into a conversation, commit it, place it in
browser/mobile source or copy it into a Docker image. `FIREBASE_SERVICE_ACCOUNT_JSON`
may contain the JSON as a deployment secret; it is not a public client setting.
Use only one credential source, protect local file permissions and rotate exposed
keys. Changing the environment requires restarting the backend process.

## Keep development and production aligned

| Client/process | Expected local development destination |
| --- | --- |
| Android debug REST/socket | `http://localhost:5001` with `adb reverse tcp:5001 tcp:5001` |
| Local web admin | `VITE_API_URL=http://localhost:5001` in `web/.env.development.local` |
| Credential check and push endpoint | That same local backend and its own environment |

Restart Vite after creating the development override and inspect the backend URL
displayed by `/admin/support`. The override is ignored by production-mode builds;
the deployed API URL must be configured before building the web bundle.

**Common failure:** an admin tab uses Railway while the phone/debug push test
uses localhost. If the servers share PostgreSQL, fetched messages can still
appear on both clients. The local Admin key does not authorize the production
process, and separate socket processes do not share presence rooms. Test the
actual backend shown in the inbox and configure its credentials independently.

## Verify credentials and sending separately

From `backend/`:

```bash
node scripts/check-push-config.js
```

The script checks credential availability, not device registration or delivery.
Next call the authenticated endpoint, using the reader account signed in on the
phone and the intended backend origin:

```bash
curl -i -X POST "$BACKEND_ORIGIN/push/test" \
  -H "Authorization: Bearer $APP_JWT" \
  -H "Content-Type: application/json" \
  -d '{}'
```

For a browser-only test use `-d '{"platform":"web"}'`. This restricts the send
to registered web tokens, so a successful Android/iOS send cannot mask a missing
browser registration. Reader and admin support pages expose this backend test
after browser alerts are enabled.

Do not paste `$APP_JWT`, device tokens, or credential contents into logs/reports.
The endpoint sends to the calling user's devices, not to an arbitrary email or
caller-provided token. Inspect `returnData.sent`, not just the HTTP status or
"test sent" text; older deployed servers may return HTTP 200 with zero sends.

| Current endpoint result | Interpretation |
| --- | --- |
| 200, positive `sent` | Firebase accepted sends; verify actual phone display separately |
| 503, `disabled` | Missing/invalid Firebase Admin configuration |
| 409, `noTokens` | No device registered to this account |
| 502, `errorCodes` | Firebase did not accept a send; inspect error codes |
| Positive `pruned` | Invalid/unregistered or mismatched-project token entries were removed according to service policy |

The admin reply response separately includes `pushDelivery` with `sent` and
`status` (`accepted`, `unavailable`, `no_devices`, `failed`). The inbox warns if
chat content saved but a phone push was not accepted. `sent` counts accepted
device sends, not messages read or confirmed notification displays.

## End-to-end support acceptance checklist

1. Confirm the intended reader is signed in on the phone; allow notifications
   and let token registration complete. Web VAPID is not an Android credential;
   iOS requires APNs configuration in addition to Firebase Admin.
2. Check the admin inbox backend address and run the credential/endpoint tests
   against that server. Confirm the current phone token belongs to the reader
   account being addressed; inspect registration metadata without logging tokens.
3. Send a new text reply from the web admin. Check the saved message and its
   push-delivery feedback independently. Attach an image in a separate test;
   its media URL must be reachable from the phone, not just the developer host.
4. While the phone stays on Home/Profile, verify live unread conversation badges
   and app-wide online presence. Enter Support to verify text/image rendering and
   sent/delivered/read transitions without refresh.
5. Repeat with the app backgrounded and normally closed, not force-stopped. Verify
   a real tray notification, then tap it into the matching conversation. The
   native link is `exegesis://support/<ticketId>?messageId=<messageId>`; the ID
   selects the conversation and does not promise an older bubble highlight.
6. Confirm one foreground notification when both websocket and FCM deliver the
   same reply. Simulate network loss/return and verify snapshot/badge recovery.
7. Repeat on the deployed backend and separately on iOS; successful local Android
   tests are not proof that production secrets, APNs or browser push are correct.

On Android, notification permission and the `exegesis-default` channel must be
enabled. `SCHEDULE_EXACT_ALARM` applies to local reminders, not remote support
push. The OS displays normal FCM notification payloads when JS is stopped; the
headless fallback only displays data-only support payloads to avoid duplicates.

After correcting configuration, send a new reply. Previously failed notifications
are not automatically replayed; conversation recovery retrieves the persisted
messages. Do not resend a saved message merely to retry push delivery.
