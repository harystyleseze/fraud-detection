import { RULE_MAP } from '../constants';

export function RuleTag({ reason, withName = false }) {
  const rule = RULE_MAP[reason];
  if (!rule) return null;
  return (
    <span className={`tag ${rule.tagClass}`}>
      <span className="tdot" style={{ background: rule.color }} />
      {withName ? rule.name : `rule ${rule.id}`}
    </span>
  );
}
