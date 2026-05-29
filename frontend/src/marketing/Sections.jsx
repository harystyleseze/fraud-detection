import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Mark } from '../components/Mark';

const RULES = [
  {
    n: 'Rule 01', icon: 'zap', color: 'var(--rule-rapid)',
    name: 'Rapid transactions',
    desc: 'More than five transactions by the same user inside any 60-second window — the signature of automated scripts, card-testing attacks, and account takeover.',
    trigger: '> 5 txns / 60 s',
  },
  {
    n: 'Rule 02', icon: 'circle-dollar-sign', color: 'var(--rule-limit)',
    name: 'Daily spending limit',
    desc: 'A single user\'s transactions exceed $10,000 in one calendar day — a marker for money laundering, stolen-card abuse, and unusual spending bursts.',
    trigger: '> $10,000 / day',
  },
  {
    n: 'Rule 03', icon: 'map-pin', color: 'var(--rule-location)',
    name: 'Impossible location jump',
    desc: 'Two transactions from one user in different locations within two minutes — physically impossible, and a tell for card cloning or simultaneous credential theft.',
    trigger: '2 locations / 2 min',
  },
];

export function Rules() {
  return (
    <section className="sec" id="rules">
      <div className="wrap">
        <div className="sec-head center">
          <div className="sec-tag">The detection logic</div>
          <h2>Three behavioural fraud rules</h2>
          <p>Every flag is explainable. No black box — a transaction can trigger more than one rule, and each is named in the case file.</p>
        </div>
        <div className="rule-grid">
          {RULES.map((r) => (
            <div className="rule-card" key={r.n}>
              <div className="accent" style={{ background: r.color }} />
              <div className="icn" style={{ background: r.color + '22', color: r.color }}>
                <Icon name={r.icon} size={20} color={r.color} />
              </div>
              <div className="rn">{r.n}</div>
              <h3>{r.name}</h3>
              <p>{r.desc}</p>
              <div className="trigger" style={{ color: r.color }}>{r.trigger}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: '1', title: 'Upload a batch', desc: 'Drop a JSON transaction file of any size. Veridian processes it as a batch — all three rules evaluate every record in a single pass.' },
    { n: '2', title: 'Rules run', desc: 'All three rules evaluate every transaction in a single pass. Matches are persisted with the rule, threshold, and timestamp that triggered them.' },
    { n: '3', title: 'Review flagged users', desc: 'Read the batch summary, then query any user ID to see their full, paginated flag history and clear the case.' },
  ];
  return (
    <section className="sec divider-top" id="how">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-tag">Workflow</div>
          <h2>From file to flagged, in one pass</h2>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <div className="step" key={s.n}>
              <div className="num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const feats = [
    { icon: 'upload',      t: 'Streamed upload',       d: 'Transaction files of any size, processed as a stream — never held in memory whole.' },
    { icon: 'database',    t: 'Persistent storage',    d: 'Flagged transactions are stored and stay queryable long after the batch is processed.' },
    { icon: 'search',      t: 'Query by user',         d: 'Look up every flag for any user ID, paginated, with the full triggering detail.' },
    { icon: 'gauge',       t: 'Summary dashboard',     d: 'Flagged counts, per-rule breakdown, and affected users the moment a batch completes.' },
    { icon: 'globe',       t: 'Fraud heatmap',         d: 'Geographic view of all flagged transactions — rule-colored on a live world map.' },
    { icon: 'braces',      t: 'Interactive API docs',  d: 'Auto-generated OpenAPI reference at /docs — try every endpoint from the browser.' },
  ];
  return (
    <section className="sec divider-top" id="features">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-tag">Built for the pipeline</div>
          <h2>Everything a compliance team needs</h2>
        </div>
        <div className="feat-grid">
          {feats.map((f) => (
            <div className="feat" key={f.t}>
              <Icon name={f.icon} size={22} color="var(--brand)" />
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ApiSection() {
  return (
    <section className="sec divider-top" id="api">
      <div className="wrap api-sec">
        <div className="sec-head">
          <div className="sec-tag">Developer-facing</div>
          <h2>A REST API for your payment pipeline</h2>
          <p>Integrate detection directly. Query flags for any user with a single call and get back every triggering transaction, structured and ready to action.</p>
          <Link className="btn secondary" to="/dashboard" style={{ marginTop: 22 }}>
            <Icon name="braces" size={15} />
            Open the dashboard
          </Link>
        </div>
        <div className="code">
          <div className="ch">
            <span className="verb">GET</span>
            /api/v1/fraud-check?userId=USR001
          </div>
          <pre>{`[
  {
    `}<span className="ck">"transaction_id"</span>{`: `}<span className="cs">"TXN-1006"</span>{`,
    `}<span className="ck">"user_id"</span>{`: `}<span className="cs">"USR001"</span>{`,
    `}<span className="ck">"amount"</span>{`: `}<span className="cn">85.00</span>{`,
    `}<span className="ck">"reasons"</span>{`: [`}<span className="cs">"RAPID_TRANSACTIONS"</span>{`],
    `}<span className="ck">"location"</span>{`: `}<span className="cs">"Lagos, NG"</span>{`,
    `}<span className="ck">"timestamp"</span>{`: `}<span className="cs">"2025-01-15T10:00:40"</span>{`
  }
]`}</pre>
        </div>
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="sec">
      <div className="wrap cta-band">
        <div className="cta-box">
          <h2>Put your transaction logs to work</h2>
          <p>Upload a batch and see the flags in seconds. No streaming infrastructure to stand up first.</p>
          <div className="cta">
            <Link className="btn primary lg" to="/dashboard">
              <Icon name="upload" size={16} />
              Open the dashboard
            </Link>
            <a className="btn secondary lg" href="#rules">Read the rules</a>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  { h: 'Product',    links: ['Rules', 'How it works', 'Features', 'API'] },
  { h: 'Developers', links: ['API reference', 'Quickstart', 'Docker setup', 'Status'] },
  { h: 'Company',    links: ['About', 'Security', 'Compliance', 'Contact'] },
];

export function Footer() {
  return (
    <footer className="m-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <Mark size={22} />
              <span className="word">Veridian</span>
            </div>
            <p className="tagline">
              Auditable fraud detection for financial-compliance teams. Every flag, traceable to the rule that raised it.
            </p>
          </div>
          {FOOTER_COLS.map((c) => (
            <div className="col" key={c.h}>
              <h4>{c.h}</h4>
              {c.links.map((l) => <a href="#" key={l}>{l}</a>)}
            </div>
          ))}
        </div>
        <div className="legal">
          <span>© 2025 Veridian Systems</span>
          <span>SOC 2 Type II · ISO 27001</span>
        </div>
      </div>
    </footer>
  );
}
