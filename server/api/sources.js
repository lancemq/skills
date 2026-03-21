import { list } from "@vercel/blob";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

function latestSourcesUrl(blobs) {
  if (!Array.isArray(blobs) || blobs.length === 0) {
    return "";
  }
  const stable = blobs.find((blob) => blob.pathname === "sources-data/latest.json");
  if (stable?.url) {
    return stable.url;
  }
  const sorted = blobs
    .filter((blob) => blob?.url && blob?.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return sorted[0]?.url || "";
}

async function resolveSourcesUrl() {
  if (process.env.SOURCES_META_BLOB_URL) {
    return process.env.SOURCES_META_BLOB_URL;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return "";
  }

  const { blobs } = await list({ prefix: "sources-data/" });
  return latestSourcesUrl(blobs);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const sourcesUrl = await resolveSourcesUrl();
    if (!sourcesUrl) {
      return res.status(404).json({ ok: false, error: "sources_meta_not_configured" });
    }
    res.setHeader("Cache-Control", CACHE_CONTROL);
    return res.redirect(307, sourcesUrl);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "sources_lookup_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
