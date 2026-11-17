# Translate + TTS Gateway — API Documentation

## Base URL

```text
http://localhost:3000
```

## Authentication

All endpoints require an API key. Use either:

```http
X-API-Key: your-api-key
```

or:

```http
Authorization: Bearer your-api-key
```

---

## Endpoints

| Method | Endpoint     | Description                                             |
| ------ | ------------ | ------------------------------------------------------- |
| `GET`  | `/health`    | Check the health of LibreTranslate and Kokoro services. |
| `GET`  | `/voices`    | List available Kokoro TTS voices.                       |
| `GET`  | `/languages` | List available LibreTranslate languages.                |
| `POST` | `/translate` | Translate text between languages.                       |
| `POST` | `/tts`       | Generate or retrieve cached speech as a WAV file.       |

### `GET /health`

Checks whether both internal services are available.

**Response:** Service health status.

---

### `GET /voices`

Returns the available Kokoro TTS voices.

**Response:** List of available voices.

---

### `GET /languages`

Returns the translation languages available in LibreTranslate.

**Response:** List of supported languages.

---

### `POST /translate`

Translates text from one language to another.

**Request body:**

| Field    | Type   | Required | Description                             |
| -------- | ------ | -------- | --------------------------------------- |
| `q`      | string | Yes      | Text to translate.                      |
| `source` | string | Yes      | Source language code, e.g. `en`.        |
| `target` | string | Yes      | Target language code, e.g. `es`.        |
| `format` | string | No       | Translation format; defaults to `text`. |

---

### `POST /tts`

Generates speech from text or returns a cached WAV file.

**Request body:**

| Field   | Type   | Required | Description                       |
| ------- | ------ | -------- | --------------------------------- |
| `text`  | string | Yes      | Text to speak. Must not be empty. |
| `voice` | string | No       | Kokoro voice.                     |
| `lang`  | string | No       | Language code.                    |
| `speed` | number | No       | Speech speed; defaults to `1`.    |

**Success response:** `audio/wav`

**Cache headers:**

| Header              | Description                           |
| ------------------- | ------------------------------------- |
| `X-TTS-Cache: HIT`  | Returned an existing cached file.     |
| `X-TTS-Cache: MISS` | Generated and saved a new file.       |
| `X-TTS-Hash`        | MD5 hash used for the cache filename. |

---

## Standard JSON Response

All JSON responses, including errors, follow this format:

```json
{
  "data": {},
  "statusCode": 200,
  "message": "Success",
  "success": true
}
```

> **Note:** Successful `POST /tts` requests return a WAV audio file instead of JSON.

---