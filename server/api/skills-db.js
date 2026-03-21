import { list } from "@vercel/blob";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

function latestBlobUrl(blobs) {
  if (!Array.isArray(blobs) || blobs.length === 0) {
    return "";
  }

  const stable = blobs.find((blob) => blob.pathname === "skills-db/latest.db");
  if (stable && stable.url) {
    return stable.url;
  }

  const sorted = blobs
    .filter((blob) => blob && blob.url && blob.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return sorted[0]?.url || "";
}

async function resolveDbUrl() {
  if (process.env.SKILLS_DB_BLOB_URL) {
    return process.env.SKILLS_DB_BLOB_URL;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return "";
  }

  const { blobs } = await list({ prefix: "skills-db/" });
  return latestBlobUrl(blobs);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const dbUrl = await resolveDbUrl();
    if (!dbUrl) {
      return res.status(404).json({ ok: false, error: "skills_db_not_configured" });
    }

    const upstream = await fetch(dbUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: "skills_db_fetch_failed",
        detail: `upstream_status:${upstream.status}`,
      });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.setHeader("Content-Type", "application/octet-stream");
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "skills_db_lookup_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
