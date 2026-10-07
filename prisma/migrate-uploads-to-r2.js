// Migrate existing backend/uploads files to Cloudflare R2 and rewrite the
// profile_photo_url / cover_photo_url columns to the new object URLs.
//
// Usage:
//   npm run migrate:uploads            # upload + update DB rows
//   npm run migrate:uploads -- --dry-run   # report only, change nothing
//
// Safe to re-run: deterministic keys are overwritten and only rows still
// pointing at a local /uploads path are rewritten.

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  putObject,
  isObjectStorageConfigured,
  contentTypeForExtension,
} from "../src/services/objectStorage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
const DRY_RUN = process.argv.includes("--dry-run");

// folder on disk -> [URL prefix stored in the DB, R2 key prefix]
const TARGETS = [
  {
    dir: "profile-photos",
    field: "profilePhotoUrl",
    urlPrefix: "/uploads/profile-photos/",
    keyPrefix: "profile-photos/",
  },
  {
    dir: "covers",
    field: "coverPhotoUrl",
    urlPrefix: "/uploads/covers/",
    keyPrefix: "covers/",
  },
];

const listFiles = (dir) => {
  const full = path.join(UPLOADS_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((name) => !name.startsWith("."))
    .filter((name) => fs.statSync(path.join(full, name)).isFile());
};

// Stored filenames are already `<uuid>.<lowercase-ext>`; keys use forward
// slashes for S3/R2 regardless of OS, which the fixed prefixes satisfy.
const keyFor = (keyPrefix, filename) => `${keyPrefix}${filename}`;

const run = async () => {
  if (!isObjectStorageConfigured()) {
    console.error(
      "❌ R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, " +
        "R2_BUCKET and R2_ENDPOINT in backend/.env before migrating.",
    );
    process.exitCode = 1;
    return;
  }

  let uploaded = 0;
  let rowsUpdated = 0;
  let unresolved = 0;

  for (const target of TARGETS) {
    const files = listFiles(target.dir);
    console.log(`\n── ${target.dir} (${files.length} file(s)) ──`);

    for (const filename of files) {
      const diskPath = path.join(UPLOADS_DIR, target.dir, filename);
      const key = keyFor(target.keyPrefix, filename);
      const localUrl = `${target.urlPrefix}${filename}`;

      // Every disk file is uploaded, whether or not a row references it, so no
      // asset is left only on local disk. Rows still pointing at the local path
      // are then rewritten to the R2 URL.
      const rows = await prisma.systemUser.findMany({
        where: { [target.field]: { endsWith: localUrl } },
        select: { id: true },
      });

      if (DRY_RUN) {
        console.log(
          `  → ${filename} → ${key} (would update ${rows.length} row(s))`,
        );
        uploaded += 1;
        rowsUpdated += rows.length;
        continue;
      }

      const buffer = fs.readFileSync(diskPath);
      const { url } = await putObject(
        key,
        buffer,
        contentTypeForExtension(path.extname(filename).replace(/^\./, "")),
      );

      if (rows.length > 0) {
        await prisma.systemUser.updateMany({
          where: { [target.field]: { endsWith: localUrl } },
          data: { [target.field]: url, updatedOn: new Date() },
        });
      }

      console.log(
        `  ✓ ${filename} → ${url}` +
          (rows.length ? ` (${rows.length} row(s))` : ""),
      );
      uploaded += 1;
      rowsUpdated += rows.length;
    }

    const unresolvedRows = await prisma.systemUser.findMany({
      where: { [target.field]: { contains: target.urlPrefix } },
      select: { id: true, username: true, [target.field]: true },
    });
    for (const row of unresolvedRows) {
      console.error(
        `  ! unresolved ${target.field}: ${row.username || row.id} -> ${row[target.field]}`,
      );
    }
    unresolved += unresolvedRows.length;
  }

  console.log("\n" + "═".repeat(50));
  console.log(`📦 Files ${DRY_RUN ? "to upload" : "uploaded"}: ${uploaded}`);
  console.log(`🗄️  DB rows updated: ${rowsUpdated}`);
  console.log(`⚠️  Unresolved local DB references: ${unresolved}`);
  if (DRY_RUN) console.log("🔍 Dry run — no changes were made.");
  console.log("═".repeat(50));
  if (unresolved > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error("\n❌ Upload migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
