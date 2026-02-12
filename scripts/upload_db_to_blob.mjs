import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../data/skills.db");

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const dbBuffer = await fs.readFile(dbPath);
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");

const versionedPath = `skills-db/skills-${stamp}.db`;
const latestPath = "skills-db/latest.db";

const versioned = await put(versionedPath, dbBuffer, {
  access: "public",
  addRandomSuffix: false,
  token,
  contentType: "application/octet-stream",
});

const latest = await put(latestPath, dbBuffer, {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  token,
  contentType: "application/octet-stream",
});

console.log("Uploaded versioned:", versioned.url);
console.log("Updated latest:", latest.url);
