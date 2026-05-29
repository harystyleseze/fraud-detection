export const RULE_MAP = {
  RAPID_TRANSACTIONS: {
    id: 1, name: 'Rapid transactions', tagClass: 'r1',
    color: '#E5484D', cssVar: 'var(--rule-rapid)',
    desc: '>5 txns / 60 s',
  },
  DAILY_LIMIT_EXCEEDED: {
    id: 2, name: 'Daily spending limit', tagClass: 'r2',
    color: '#4C8DF6', cssVar: 'var(--rule-limit)',
    desc: '>$10,000 / day',
  },
  IMPOSSIBLE_LOCATION_JUMP: {
    id: 3, name: 'Impossible location jump', tagClass: 'r3',
    color: '#E0A23A', cssVar: 'var(--rule-location)',
    desc: '2 locations / 2 min',
  },
};

export const RULES_LIST = Object.entries(RULE_MAP).map(([key, val]) => ({ key, ...val }));

export const RULE_KEYS = Object.keys(RULE_MAP);

export function formatMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dominantRule(reasonSet) {
  if (reasonSet.has('RAPID_TRANSACTIONS')) return 'RAPID_TRANSACTIONS';
  if (reasonSet.has('DAILY_LIMIT_EXCEEDED')) return 'DAILY_LIMIT_EXCEEDED';
  return 'IMPOSSIBLE_LOCATION_JUMP';
}
