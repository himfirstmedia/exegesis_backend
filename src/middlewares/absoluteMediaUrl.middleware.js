/**
 * Convert a single media URL to absolute when it is a backend-relative path.
 * Already-absolute URLs (http/https/data/file/protocol-relative) pass through
 * untouched, as do empty values.
 */
export const toAbsoluteMediaUrl = (url, baseUrl) => {
  if (typeof url !== "string" || !url) return url;
  if (/^(https?:|data:|file:|\/\/)/i.test(url)) return url;
  if (url.startsWith("/")) {
    const base = (baseUrl || "").replace(/\/+$/, "");
    return base ? `${base}${url}` : url;
  }
  return url;
};

/**
 * Recursively absolutize media paths inside API payloads.
 * Only string values starting with "/uploads/" (the media root served by the
 * backend) are rewritten; everything else — including already-absolute URLs,
 * bible text, timestamps, BigInt-serialized numbers — passes through unchanged.
 * Subtrees where nothing was rewritten are returned as-is (same reference), so
 * large media-free payloads (bible chapters, search results) aren't re-allocated.
 */
export const absolutizeMediaUrls = (value, baseUrl) => {
  if (typeof value === "string") {
    return value.startsWith("/uploads/")
      ? toAbsoluteMediaUrl(value, baseUrl)
      : value;
  }
  if (Array.isArray(value)) {
    let changed = false;
    const result = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      const item = absolutizeMediaUrls(value[i], baseUrl);
      if (item !== value[i]) changed = true;
      result[i] = item;
    }
    return changed ? result : value;
  }
  if (value && typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    let changed = false;
    const result = {};
    for (const key of Object.keys(value)) {
      const item = absolutizeMediaUrls(value[key], baseUrl);
      if (item !== value[key]) changed = true;
      result[key] = item;
    }
    return changed ? result : value;
  }
  return value;
};

/**
 * Derive the public base URL for this request. Behind a reverse proxy
 * (Railway, nginx…) the first X-Forwarded-{Proto,Host} entries reflect what the
 * client actually used; req.protocol/req.get("host") alone would report the
 * internal hop. When unavailable, the URL is left relative (safe fallback).
 */
const getBaseUrl = (req) => {
  const headers = req.headers || {};
  const forwardedProto = headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0].trim()
      : req.protocol || "http";
  const forwardedHost = headers["x-forwarded-host"];
  const host =
    typeof forwardedHost === "string"
      ? forwardedHost.split(",")[0].trim()
      : req.get?.("host");
  return host ? `${protocol}://${host}` : "";
};

/**
 * Transform a response body: absolutize relative media paths inside returnData.
 * Bodies without returnData (e.g. Stripe webhook acks) pass through untouched.
 */
const transformBody = (body, baseUrl) => {
  if (
    body &&
    typeof body === "object" &&
    body.returnData !== undefined &&
    body.returnData !== null
  ) {
    body.returnData = absolutizeMediaUrls(body.returnData, baseUrl);
  }
  return body;
};

/**
 * Wrap res.json/res.send so every API response's returnData has relative media
 * paths (e.g. "/uploads/profile-photos/x.png") rewritten to absolute URLs
 * (e.g. "https://host/uploads/profile-photos/x.png"). Clients can then pass
 * profilePhotoUrl / coverPhotoUrl straight to <Image> without normalizing.
 * res.send is wrapped too (the /health endpoint uses it with an object body);
 * binary sends (static files, streams, Buffers) are left untouched.
 *
 * Must be registered before the route handlers.
 */
export const absoluteMediaUrl = (req, res, next) => {
  const baseUrl = getBaseUrl(req);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => originalJson(transformBody(body, baseUrl));
  res.send = (body) => {
    if (body && typeof body === "object" && !Buffer.isBuffer(body) && !(body instanceof Date)) {
      body = transformBody(body, baseUrl);
    }
    return originalSend(body);
  };
  next();
};

