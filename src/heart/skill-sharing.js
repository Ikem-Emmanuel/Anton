// Cross-agent skill sharing (§4.5.6) — surfaces high-performing private
// skills as share proposals so Noel can approve them for the shared pool.
//
// The discovery side was already in place (SQLite `shared` column + tags +
// findShareableSkills query with success_rate > 0.8, evidence > 5). This
// module adds the proactive layer: scan on a cadence, propose to Noel,
// avoid re-proposing the same skill after a rejection.
//
// Dedup is in-memory for this process. On restart the dedup set resets
// and pending proposals fire again — acceptable because Noel can still
// reject and the proposal stays quiet until the next high-success
// threshold. A persistent `share_proposed_at` column would be cleaner
// but adds a schema migration; deferred until repeated duplicates
// become observable.

const proposed = new Set(); // skill ids already proposed this process

/**
 * Run one pass of the skill-share scan. Picks up to `maxPerRun` newly
 * eligible skills and emits a proposal for each.
 *
 * deps = {
 *   findShareableSkills()  → [Skill, ...]
 *   notifyNoel(severity, msg)
 * }
 */
export function runSkillShareScan(deps, options = {}) {
  const { findShareableSkills, notifyNoel } = deps;
  const { maxPerRun = 3 } = options;
  try {
    const candidates = findShareableSkills() || [];
    const fresh = candidates.filter((s) => !proposed.has(s.id)).slice(0, maxPerRun);
    for (const skill of fresh) {
      const total = (skill.success_count || 0) + (skill.failure_count || 0);
      const rate = total > 0 ? Math.round(((skill.success_count || 0) / total) * 100) : 0;
      notifyNoel(
        'P3',
        `*Skill share proposal* — ${skill.owner_agent} has a pattern working ${rate}% (${skill.success_count}/${total}):\n` +
          `• ${skill.title || skill.context_pattern}\n\n` +
          `Approve to share with other agents: reply *share skill ${skill.id}*`
      );
      proposed.add(skill.id);
    }
    return { proposed: fresh.length, skipped: candidates.length - fresh.length };
  } catch (e) {
    console.error('[SkillSharing] scan failed:', e.message?.slice(0, 100));
    return { proposed: 0, error: e.message };
  }
}

/** Forget a proposal so it can re-surface next scan. Used after Noel rejects
 *  (don't spam) or after explicit reset for testing. */
export function forgetProposal(skillId) {
  proposed.delete(skillId);
}

/** Drop all remembered proposals — only used by tests between runs. */
export function resetProposals() {
  proposed.clear();
}
