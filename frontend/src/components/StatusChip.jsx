import { Icon } from './Icon';

const MAP = {
  flagged:  ['flag',  'Flagged',       'var(--danger)'],
  review:   ['warn',  'Needs review',  'var(--warn)'],
  cleared:  ['clear', 'Cleared',       'var(--brand)'],
  progress: ['info',  'In progress',   'var(--info)'],
};

export function StatusChip({ status = 'flagged' }) {
  const [cls, label, dotColor] = MAP[status] || MAP.flagged;
  return (
    <span className={`chip ${cls}`}>
      {status === 'cleared'
        ? <Icon name="check" size={12} />
        : <span className="dot" style={{ background: dotColor }} />}
      {label}
    </span>
  );
}
