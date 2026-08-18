export const CRISIS_RESPONSE = `I hear that things feel really heavy right now, and I'm glad you said
something. I'm just an AI wellness companion though, not the right kind
of support for this — please reach out to the NCMH Crisis Hotline: 1553
(or 1800-1888-1553), or 0917-899-8727. They're available 24/7. If you're
in immediate danger, please contact emergency services or go to the
nearest hospital. You don't have to go through this alone.`;

const SELF_HARM_PATTERNS = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i,
  /\b(suicid(e|al)|want\s+to\s+die|end\s+my\s+life|take\s+my\s+life)\b/i,
  /\b(cut|cutting|overdose|od|pills)\b/i,
  /\b(self[- ]?harm|self[- ]?injury)\b/i,
];

const HOPELESSNESS_PATTERNS = [
  /\b(hopeless|no\s+point|nothing\s+matters|give\s+up|can't\s+go\s+on|can't\s+take\s+it)\b/i,
];

const PLAN_PATTERNS = [
  /\b(plan\s+to|way\s+to|method\s+(of|for)|how\s+to\s+(kill|hurt|harm|end))\b/i,
];

const ABUSE_DANGER_PATTERNS = [
  /\b(abuse|abused|assault|raped|molest)\b/i,
  /\b(immediate\s+danger|in\s+danger|unsafe|threaten|threatening)\b/i,
  /\b(domestic\s+violence|partner\s+hurt|family\s+hurt)\b/i,
];

const ALL_PATTERNS = [
  ...SELF_HARM_PATTERNS,
  ...ABUSE_DANGER_PATTERNS,
];

function hasHopelessnessWithPlan(text) {
  const normalized = text.toLowerCase();
  const hasHopelessness = HOPELESSNESS_PATTERNS.some((p) => p.test(normalized));
  const hasPlan = PLAN_PATTERNS.some((p) => p.test(normalized));
  return hasHopelessness && hasPlan;
}

export function checkCrisis(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const normalized = text.toLowerCase();
  if (ALL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  return hasHopelessnessWithPlan(text);
}