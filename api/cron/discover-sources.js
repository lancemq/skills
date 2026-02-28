import {
  isAuthorized,
  nowIso,
  loadExistingSkills,
  loadExistingSourcesMeta,
  discoverSourcesFromWeb,
  collectSkillsFromSources,
  verifyCollectedLinks,
  mergeSkills,
  updateSourcesMeta,
  persistJson,
} from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const existingSkills = await loadExistingSkills();
    const existingSourcesMeta = await loadExistingSourcesMeta();

    const discoveredSources = await discoverSourcesFromWeb(existingSourcesMeta.sources || []);
    const { collected, sourceStats } = await collectSkillsFromSources(discoveredSources);
    const linkChecks = await verifyCollectedLinks(collected, process.env.CRON_DISCOVERY_LINK_CHECK_LIMIT || 500);

    const { merged, created, updated } = mergeSkills(existingSkills, collected, linkChecks.results);
    const nextSourcesMeta = await updateSourcesMeta(existingSourcesMeta, discoveredSources, merged);

    const persistSkills = await persistJson("skills-data/skills", "skills-data/latest.json", merged);
    const persistSources = await persistJson(
      "sources-data/sources",
      "sources-data/latest.json",
      nextSourcesMeta
    );

    return res.status(200).json({
      ok: true,
      now: nowIso(),
      existing_skills: existingSkills.length,
      discovered_sources: discoveredSources.length,
      discovered_skill_refs: collected.length,
      checked_links: linkChecks.checked,
      total_skills: merged.length,
      created,
      updated,
      persist_skills: persistSkills,
      persist_sources: persistSources,
      sources: sourceStats,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "discover_sources_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
