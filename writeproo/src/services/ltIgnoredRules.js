const STORAGE_KEY = 'writepro-lt-disabled-rules'

/** @returns {string[]} */
export function getIgnoredLtRuleIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.length > 0) : []
  } catch {
    return []
  }
}

/** @param {string} ruleId */
export function addIgnoredLtRuleId(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return
  const set = new Set(getIgnoredLtRuleIds())
  set.add(ruleId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}
