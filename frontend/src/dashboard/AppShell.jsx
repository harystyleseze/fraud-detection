import { Mark } from '../components/Mark';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';

const NAV_ITEMS = [
  { id: 'overview',  icon: 'gauge',          label: 'Overview',      section: 'Monitor' },
  { id: 'flagged',   icon: 'triangle-alert', label: 'Flagged users', section: null },
  { id: 'heatmap',   icon: 'globe',          label: 'Fraud map',     section: null },
  { id: 'upload',    icon: 'upload',         label: 'Upload batch',  section: 'Ingest' },
  { id: 'batches',   icon: 'file-json',      label: 'Batches',       section: null },
];

export function Sidebar({ view, setView, flaggedCount }) {
  let lastSection = null;

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <Mark size={24} />
        <span className="word">Veridian</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const showSection = item.section && item.section !== lastSection;
        if (showSection) lastSection = item.section;
        return (
          <span key={item.id}>
            {showSection && <div className="sb-section">{item.section}</div>}
            <button
              className={`nav-item${view === item.id ? ' active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
              {item.id === 'flagged' && flaggedCount > 0 && (
                <span className="badge">{flaggedCount}</span>
              )}
            </button>
          </span>
        );
      })}

      <div className="sb-spacer" />

      <div className="sb-user">
        <span className="avatar">AM</span>
        <div className="meta">
          <div className="nm">A. Mensah</div>
          <div className="rl">Fraud analyst</div>
        </div>
      </div>
    </aside>
  );
}

const TITLES = {
  overview: 'Overview',
  flagged:  'Flagged users',
  heatmap:  'Fraud map',
  upload:   'Upload batch',
  batches:  'Batches',
};

export function Topbar({ view, lastUpload, onUpload }) {
  const title = TITLES[view] || view;
  const crumb = lastUpload && (view === 'overview' || view === 'flagged' || view === 'heatmap')
    ? `${lastUpload.total_transactions.toLocaleString()} transactions`
    : null;

  return (
    <div className="topbar">
      <span className="title">{title}</span>
      {crumb && <span className="crumb">{crumb}</span>}
      <div className="right">
        {view !== 'upload' && (
          <Button variant="primary" size="sm" icon="upload" onClick={onUpload}>
            Upload batch
          </Button>
        )}
      </div>
    </div>
  );
}
