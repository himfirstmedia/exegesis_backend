// Read-only credential check. Never prints keys, access tokens or device tokens.
import 'dotenv/config';
import { verifyPushCredentials } from '../src/modules/push/service.js';

const ready = await verifyPushCredentials();
console.log(ready
  ? '[push] Credentials verified. Next register a device and call POST /push/test.'
  : '[push] Credentials missing/invalid. Configure Firebase Admin credentials and restart the backend.');
process.exitCode = ready ? 0 : 1;
