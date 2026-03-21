import {
  isAuthorized,
  nowIso,
  loadExistingSkills,
  loadExistingSourcesMeta,
  checkLinkStatus,
  enrichSkillFromPage,
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
    const skills = await loadExistingSkills();
    const sourcesMeta = await loadExistingSourcesMeta();
    const concurrency = Number(process.env.CRON_HEALTH_CONCURRENCY || 10);
    const enrichLimit = Number(process.env.CRON_ENRICH_LIMIT || 250);

    let index = 0;
    let checked = 0;
    let markedInvalid = 0;
    let reactivated = 0;
    let enriched = 0;
    let changed = 0;

    async function worker() {
      while (index < skills.length) {
        const i = index;
        index += 1;
        const skill = skills[i];
        let skillChanged = false;

        const status = await checkLinkStatus(skill.detail_url || skill.source_url);
        checked += 1;

        const prevActive = skill.is_active !== false;
        const nextActive = status !== "bad";
        if (prevActive !== nextActive) {
          skill.is_active = nextActive;
          changed += 1;
          skillChanged = true;
          if (!nextActive) markedInvalid += 1;
          if (nextActive) reactivated += 1;
        }

        if (skill.link_status !== status) {
          skill.link_status = status;
          changed += 1;
          skillChanged = true;
        }
        skill.verified_at = nowIso();

        const needsEnrich =
          status === "ok" &&
          enriched < enrichLimit &&
          (!skill.short_description || !skill.long_description || !skill.category || !skill.tags || skill.tags.length === 0);

        if (needsEnrich) {
          const result = await enrichSkillFromPage(skill);
          if (result.changed) {
            enriched += 1;
            changed += 1;
            skillChanged = true;
          }
        }

        if (!skill.created_at) {
          skill.created_at = nowIso();
          changed += 1;
          skillChanged = true;
        }
        if (skillChanged) {
          skill.updated_at = nowIso();
        }
      }
    }

    const jobs = [];
    for (let i = 0; i < Math.max(1, concurrency); i += 1) jobs.push(worker());
    await Promise.all(jobs);

    const nextSourcesMeta = await updateSourcesMeta(sourcesMeta, sourcesMeta.sources || [], skills);

    const persistSkills = await persistJson("skills-data/skills", "skills-data/latest.json", skills);
    const persistSources = await persistJson(
      "sources-data/sources",
      "sources-data/latest.json",
      nextSourcesMeta
    );

    return res.status(200).json({
      ok: true,
      now: nowIso(),
      total_skills: skills.length,
      checked,
      marked_invalid: markedInvalid,
      reactivated,
      enriched,
      changed,
      persist_skills: persistSkills,
      persist_sources: persistSources,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "daily_health_failed",
      detail: error?.message || "unknown_error",
    });
  }
}
