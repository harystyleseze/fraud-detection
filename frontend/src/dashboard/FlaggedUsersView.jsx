import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Panel } from '../components/Panel';
import { StatusChip } from '../components/StatusChip';
import { RuleTag } from '../components/RuleTag';
import { getFlaggedTransactions } from '../api';
import { formatMoney, formatDate } from '../constants';

function UserDrawer({ userId, onClose }) {
  const [txns, setTxns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [cleared, setCleared] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    getFlaggedTransactions(userId, page, LIMIT)
      .then(setTxns)
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, [userId, page]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalAmount = txns ? txns.reduce((s, t) => s + t.amount, 0) : 0;
  const lastActivity = txns?.length ? txns.reduce((a, t) => (t.timestamp > a ? t.timestamp : a), txns[0].timestamp) : null;
  const uniqueLocations = txns ? [...new Set(txns.map(t => t.location).filter(Boolean))].join(' · ') : '—';
  const uniqueReasons = txns ? [...new Set(txns.flatMap(t => t.reasons))] : [];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={`Flags for ${userId}`}>
        <div className="drawer-head">
          <Avatar id={userId} size={40} fontSize={13} />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{userId}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {cleared
                ? <StatusChip status="cleared" />
                : <StatusChip status="flagged" />}
              {uniqueReasons.map((r) => <RuleTag key={r} reason={r} />)}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-3)', fontSize: 13 }}>
              Loading flags…
            </div>
          ) : (
            <>
              <div className="panel" style={{ padding: 16 }}>
                <div className="kv">
                  <span className="k">Total flagged</span>
                  <span className="v" style={{ color: 'var(--danger)' }}>{formatMoney(totalAmount)}</span>
                  <span className="k">Flag events</span>
                  <span className="v">{txns.length}{txns.length === LIMIT ? '+' : ''}</span>
                  <span className="k">Last activity</span>
                  <span className="v">{lastActivity ? formatDate(lastActivity) : '—'}</span>
                  <span className="k">Location(s)</span>
                  <span className="v" style={{ fontFamily: 'var(--font-ui)' }}>{uniqueLocations || '—'}</span>
                </div>
              </div>

              {txns.length === 0 ? (
                <div className="empty" style={{ padding: '24px 0' }}>
                  <p>No flagged transactions found.</p>
                </div>
              ) : (
                <div>
                  <div className="label" style={{ marginBottom: 12 }}>Flag events ({txns.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {txns.map((t) => (
                      <div className="flag-event" key={t.id}>
                        <div className="top">
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {t.reasons.map((r) => <RuleTag key={r} reason={r} withName />)}
                          </div>
                          <span className="mono" style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
                            {formatMoney(t.amount)}
                          </span>
                        </div>
                        <div className="grid">
                          <span className="k">txn</span>
                          <span className="v">{t.transaction_id}</span>
                          <span className="k">time</span>
                          <span className="v">{t.timestamp.replace('T', ' ')}</span>
                          {t.merchant && <><span className="k">merchant</span><span className="v" style={{ fontFamily: 'var(--font-ui)' }}>{t.merchant}</span></>}
                          {t.location && <><span className="k">location</span><span className="v" style={{ fontFamily: 'var(--font-ui)' }}>{t.location}</span></>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {txns.length === LIMIT && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>Next<Icon name="chevron-right" size={14} /></Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="drawer-foot">
          <Button
            variant={cleared ? 'secondary' : 'primary'}
            icon="shield-check"
            onClick={() => setCleared(!cleared)}
            style={{ flex: 1 }}
          >
            {cleared ? 'Case reviewed' : 'Mark case reviewed'}
          </Button>
          <Button variant="secondary" icon="download">Export</Button>
        </div>
      </div>
    </>
  );
}

export function FlaggedUsersView({ lastUpload }) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [manualSearch, setManualSearch] = useState('');

  const allUsers = lastUpload?.flagged_users ?? [];

  const filtered = allUsers.filter((uid) => {
    if (search && !uid.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (manualSearch.trim()) setSelectedUser(manualSearch.trim());
  };

  if (!lastUpload) {
    return (
      <div className="content-inner fade-up">
        <div className="page-head">
          <div>
            <h1>Flagged users</h1>
            <div className="sub">Query any user to see their full flag history.</div>
          </div>
        </div>

        <Panel pad>
          <div className="empty" style={{ padding: '48px 20px' }}>
            <Icon name="search" size={28} color="var(--fg-3)" />
            <p style={{ marginTop: 12, marginBottom: 20 }}>No batch loaded. Upload a batch to see flagged users.</p>
          </div>
          <form onSubmit={handleManualLookup} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto 20px' }}>
            <div className="inp mono" style={{ flex: 1 }}>
              <Icon name="search" size={15} />
              <input
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="Look up any user ID…"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={!manualSearch.trim()}>
              Look up
            </Button>
          </form>
        </Panel>

        {selectedUser && (
          <UserDrawer userId={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="content-inner fade-up">
      <div className="page-head">
        <div>
          <h1>Flagged users</h1>
          <div className="sub">
            {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} flagged in this batch
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1, minWidth: 240 }}>
          <label>Search by user ID</label>
          <div className="inp mono">
            <Icon name="search" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter…"
            />
          </div>
        </div>
      </div>

      <Panel>
        <div className="tbl">
          <div className="thead" style={{ gridTemplateColumns: '1fr auto auto' }}>
            <span>User</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtered.map((uid) => (
            <div
              key={uid}
              className={`trow${selectedUser === uid ? ' sel' : ''}`}
              style={{ gridTemplateColumns: '1fr auto auto' }}
              onClick={() => setSelectedUser(uid)}
            >
              <span className="uid">
                <Avatar id={uid} />
                {uid}
              </span>
              <span className="right-align"><StatusChip status="flagged" /></span>
              <span style={{ color: 'var(--fg-3)' }}><Icon name="chevron-right" size={14} /></span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">
              <Icon name="search" size={24} />
              <p>No users match &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
        <div className="pag">
          <span>Showing {filtered.length} of {allUsers.length} flagged users</span>
        </div>
      </Panel>

      {selectedUser && (
        <UserDrawer userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
