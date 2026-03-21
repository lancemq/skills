import { list } from "@vercel/blob";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

function latestJsonUrl(blobs) {
  if (!Array.isArray(blobs) || blobs.length === 0) {
    return "";
  }
  const stable = blobs.find((blob) => blob.pathname === "skills-data/latest.json");
  if (stable?.url) {
    return stable.url;
  }
  const sorted = blobs
    .filter((blob) => blob?.url && blob?.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return sorted[0]?.url || "";
}

async function resolveSkillsUrl() {
  if (process.env.SKILLS_JSON_BLOB_URL) {
    return process.env.SKILLS_JSON_BLOB_URL;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return "";
  }

  const { blobs } = await list({ prefix: "skills-data/" });
  return latestJsonUrl(blobs);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const skillsUrl = await resolveSkillsUrl();
    if (!skillsUrl) {
      return res.status(404).json({ ok: false, error: "skills_json_not_configured" });
    }
    res.setHeader("Cache-Control", CACHE_CONTROL);
    return res.redirect(307, skillsUrl);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "skills_json_lookup_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
