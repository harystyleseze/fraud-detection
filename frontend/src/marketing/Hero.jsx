import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap hero-inner fade-up">
        <span className="eyebrow">
          <Icon name="shield-check" size={13} />
          Fraud detection for compliance teams
        </span>
        <h1>Detection,<br />made <span className="g">auditable.</span></h1>
        <p className="lede">
          Veridian streams your transaction logs, applies three behavioural fraud rules, and
          surfaces flagged users for review — every flag traced back to the exact rule, threshold,
          and transaction that triggered it.
        </p>
        <div className="cta">
          <Link className="btn primary lg" to="/dashboard">
            <Icon name="upload" size={16} />
            Upload a batch
          </Link>
          <a className="btn secondary lg" href="#rules">View the rules</a>
        </div>
        <div className="trust">Streamed ingestion · never loaded into memory whole</div>
      </div>

      <div className="wrap">
        <div className="preview-frame fade-up">
          <div className="pf-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="addr">app.veridian.io/overview</span>
          </div>
          <div className="pf-body">
            <div className="pf-metric">
              <div className="l">Flagged</div>
              <div className="v" style={{ color: 'var(--danger)' }}>327</div>
            </div>
            <div className="pf-metric">
              <div className="l">Transactions</div>
              <div className="v">12,840</div>
            </div>
            <div className="pf-metric">
              <div className="l">Users</div>
              <div className="v">61</div>
            </div>
            <div className="pf-metric">
              <div className="l">Flag rate</div>
              <div className="v" style={{ color: 'var(--brand)' }}>2.5%</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
