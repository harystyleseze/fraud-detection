import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { getFlaggedTransactions } from '../api';
import { geocode } from '../lib/geocoder';
import { formatMoney, RULE_MAP, RULES_LIST, dominantRule } from '../constants';

// Rule colors resolved from CSS (Leaflet doesn't read CSS vars)
const RULE_COLORS = {
  RAPID_TRANSACTIONS:       '#E5484D',
  DAILY_LIMIT_EXCEEDED:     '#4C8DF6',
  IMPOSSIBLE_LOCATION_JUMP: '#E0A23A',
};

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function FitBounds({ geoData }) {
  const map = useMap();
  useEffect(() => {
    if (!geoData.length) return;
    try {
      const bounds = geoData.map((d) => d.coords);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6 });
    } catch {}
  }, [geoData]);
  return null;
}

export function HeatmapView({ lastUpload, setView }) {
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: 0 });
  const [ruleFilter, setRuleFilter] = useState(null); // null = all
  const abortRef = useRef(false);

  useEffect(() => {
    if (!lastUpload?.flagged_users?.length) return;

    abortRef.current = false;
    setLoading(true);
    setGeoData([]);

    const users = lastUpload.flagged_users;
    setLoadProgress({ done: 0, total: users.length });

    const batches = chunk(users, 5);
    const allTxns = [];

    (async () => {
      for (const batch of batches) {
        if (abortRef.current) break;
        const results = await Promise.all(
          batch.map((uid) => getFlaggedTransactions(uid, 1, 100).catch(() => []))
        );
        results.forEach((txns) => allTxns.push(...txns));
        setLoadProgress((p) => ({ ...p, done: p.done + batch.length }));
      }

      if (abortRef.current) return;

      // Aggregate by location
      const locMap = new Map();
      for (const txn of allTxns) {
        if (!txn.location) continue;
        const existing = locMap.get(txn.location) || { count: 0, totalAmount: 0, rules: new Set() };
        existing.count += 1;
        existing.totalAmount += txn.amount;
        txn.reasons.forEach((r) => existing.rules.add(r));
        locMap.set(txn.location, existing);
      }

      // Geocode and build final data
      const points = [];
      for (const [location, data] of locMap.entries()) {
        const coords = geocode(location);
        if (!coords) continue;
        const dom = dominantRule(data.rules);
        points.push({
          location,
          coords,
          count: data.count,
          totalAmount: data.totalAmount,
          rules: [...data.rules],
          dominantRule: dom,
          color: RULE_COLORS[dom],
        });
      }

      setGeoData(points);
      setLoading(false);
    })();

    return () => { abortRef.current = true; };
  }, [lastUpload]);

  const visibleData = ruleFilter
    ? geoData.filter((d) => d.rules.includes(ruleFilter))
    : geoData;

  const topLocations = [...geoData].sort((a, b) => b.count - a.count).slice(0, 5);
  const totalOnMap = visibleData.reduce((s, d) => s + d.count, 0);
  const totalAmount = visibleData.reduce((s, d) => s + d.totalAmount, 0);
  const topCity = geoData[0]?.location ?? '—';

  // Rule breakdown counts for legend
  const ruleCounts = {};
  RULES_LIST.forEach((r) => {
    ruleCounts[r.key] = geoData.filter((d) => d.rules.includes(r.key)).reduce((s, d) => s + d.count, 0);
  });

  if (!lastUpload) {
    return (
      <div className="content-inner fade-up">
        <div className="page-head">
          <div>
            <h1>Fraud map</h1>
            <div className="sub">Geographic distribution of flagged transactions by rule type.</div>
          </div>
        </div>
        <div className="map-loading" style={{ minHeight: 400 }}>
          <Icon name="globe" size={36} color="var(--fg-3)" />
          <div className="ml-label">Upload a batch to see the fraud map.</div>
          <Button variant="secondary" icon="upload" onClick={() => setView('upload')}>
            Upload batch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-inner fade-up">
      <div className="page-head">
        <div>
          <h1>Fraud map</h1>
          <div className="sub">
            {loading
              ? `Loading location data — ${loadProgress.done} / ${loadProgress.total} users`
              : `${geoData.length} locations · ${visibleData.length} shown`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="heatmap-filters">
            <span className="filter-label">Filter</span>
            <button
              className={`btn sm${!ruleFilter ? ' primary' : ' secondary'}`}
              onClick={() => setRuleFilter(null)}
            >
              All rules
            </button>
            {RULES_LIST.map((rule) => (
              <button
                key={rule.key}
                className={`btn sm${ruleFilter === rule.key ? ' primary' : ' secondary'}`}
                style={ruleFilter === rule.key ? { background: rule.color, borderColor: rule.color, color: '#fff' } : {}}
                onClick={() => setRuleFilter(ruleFilter === rule.key ? null : rule.key)}
              >
                <span style={{ width: 7, height: 7, borderRadius: 2, background: rule.color, display: 'inline-block', marginRight: 4 }} />
                {`Rule ${rule.id}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="map-loading">
          <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="ml-label">Loading location data…</div>
          <div className="ml-prog">{loadProgress.done} of {loadProgress.total} users fetched</div>
        </div>
      ) : (
        <div className="heatmap-wrap">
          <MapContainer
            center={[20, 15]}
            zoom={2}
            style={{ height: 520 }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            {geoData.length > 0 && <FitBounds geoData={visibleData} />}
            {visibleData.map((d) => (
              <CircleMarker
                key={d.location}
                center={d.coords}
                radius={Math.max(5, 5 + Math.log1p(d.count) * 5)}
                pathOptions={{
                  fillColor: d.color,
                  fillOpacity: 0.78,
                  color: d.color,
                  weight: 1.5,
                  opacity: 0.5,
                }}
              >
                <Tooltip className="v-map-tooltip" sticky>
                  <strong>{d.location}</strong><br />
                  {d.count} flag{d.count !== 1 ? 's' : ''} · {formatMoney(d.totalAmount)}<br />
                  {d.rules.map((r) => RULE_MAP[r]?.name).filter(Boolean).join(', ')}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {!loading && geoData.length > 0 && (
        <>
          <div className="map-stats">
            <div className="map-stat">
              <div className="sl">Locations on map</div>
              <div className="sv">{visibleData.length}</div>
            </div>
            <div className="map-stat">
              <div className="sl">Top location</div>
              <div className="sv" style={{ fontSize: 13, lineHeight: 1.3, fontFamily: 'var(--font-ui)' }}>
                {topCity}
              </div>
            </div>
            <div className="map-stat">
              <div className="sl">Total flagged</div>
              <div className="sv" style={{ color: 'var(--danger)' }}>{formatMoney(totalAmount)}</div>
            </div>
          </div>

          <div className="heatmap-bottom">
            <Panel title="Rule legend">
              <div className="rules">
                {RULES_LIST.map((rule) => (
                  <div className="rule-row" key={rule.key}>
                    <span className="dot" style={{ background: rule.color }} />
                    <div>
                      <div className="nm">{rule.name}</div>
                      <div className="ds">{rule.desc}</div>
                    </div>
                    <span className="ct">{ruleCounts[rule.key] ?? 0}</span>
                    <span className="bar">
                      <i style={{
                        width: ruleCounts[rule.key]
                          ? (ruleCounts[rule.key] / Math.max(...Object.values(ruleCounts))) * 100 + '%'
                          : '0%',
                        background: rule.color,
                      }} />
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Top locations">
              <div className="rules">
                {topLocations.map((d, i) => (
                  <div
                    key={d.location}
                    className="rule-row"
                    style={{ gridTemplateColumns: '24px 1fr auto' }}
                  >
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="nm" style={{ fontSize: 12.5 }}>{d.location}</div>
                      <div className="ds">{d.count} flag{d.count !== 1 ? 's' : ''}</div>
                    </div>
                    <span className="amt" style={{ color: 'var(--danger)', fontSize: 12 }}>
                      {formatMoney(d.totalAmount)}
                    </span>
                  </div>
                ))}
                {topLocations.length === 0 && (
                  <div style={{ padding: '20px 16px', color: 'var(--fg-3)', fontSize: 12 }}>
                    No geocoded locations found.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-tooltip.v-map-tooltip {
          background: var(--surface-3);
          border: 1px solid rgba(255,255,255,0.15);
          color: #ECECED;
          font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          border-radius: 6px;
          box-shadow: 0 4px 14px -6px rgba(0,0,0,0.55);
          padding: 8px 10px;
          line-height: 1.5;
        }
        .leaflet-tooltip.v-map-tooltip::before { display: none; }
      `}</style>
    </div>
  );
}
