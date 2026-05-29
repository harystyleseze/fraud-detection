import { Panel } from '../components/Panel';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { formatDate } from '../constants';

export function BatchesView({ lastUpload, setView }) {
  const rows = lastUpload
    ? [
        {
          id: 'current',
          label: 'Current batch',
          uploaded: new Date().toISOString(),
          total: lastUpload.total_transactions,
          flagged: lastUpload.flagged_count,
          users: lastUpload.flagged_users.length,
          current: true,
        },
      ]
    : [];

  return (
    <div className="content-inner fade-up">
      <div className="page-head">
        <div>
          <h1>Batches</h1>
          <div className="sub">Every processed file is stored and queryable.</div>
        </div>
        <Button variant="secondary" icon="upload" onClick={() => setView('upload')}>
          New batch
        </Button>
      </div>

      <Panel>
        <div className="tbl">
          <div className="thead" style={{ gridTemplateColumns: '0.7fr 1.3fr 1fr 0.8fr 0.8fr' }}>
            <span>Batch</span>
            <span>Label</span>
            <span>Processed</span>
            <span>Flagged</span>
            <span>Users</span>
          </div>

          {rows.map((b) => (
            <div
              key={b.id}
              className="trow"
              style={{ gridTemplateColumns: '0.7fr 1.3fr 1fr 0.8fr 0.8fr', cursor: b.current ? 'pointer' : 'default' }}
              onClick={() => b.current && setView('overview')}
            >
              <span className="uid" style={{ gap: 6 }}>
                <Icon name="file-json" size={13} color="var(--brand)" />
                current
              </span>
              <span style={{ color: 'var(--fg-2)', fontSize: 13 }}>Current batch</span>
              <span className="num">{formatDate(b.uploaded)}</span>
              <span className="amt hot">{b.flagged.toLocaleString()}</span>
              <span className="num">{b.users}</span>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="empty">
              <Icon name="file-json" size={24} color="var(--fg-3)" />
              <p>No batches yet. Upload a transaction file to run the fraud rules.</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
