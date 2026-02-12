function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const auth = req.headers.authorization || "";
  return auth === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  // Vercel Functions are ephemeral and cannot persist updates to local repo files.
  // This endpoint is intended as a cron trigger/orchestrator.
  // Implement your real sync via external storage or GitHub Actions dispatch.
  return res.status(200).json({
    ok: true,
    message: "Cron trigger is active. Implement external sync execution in this handler.",
    now: new Date().toISOString()
  });
}
