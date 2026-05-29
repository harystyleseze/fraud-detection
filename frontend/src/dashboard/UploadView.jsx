import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { useToast } from '../components/ToastProvider';
import { uploadTransactions } from '../api';
import { formatMoney } from '../constants';

const STEPS = [
  'Sending batch to server…',
  'Validating transaction records…',
  'Rule 1 — scanning 60-second windows…',
  'Rule 2 — aggregating daily totals…',
  'Rule 3 — comparing location strings…',
  'Persisting flags to store…',
];

export function UploadView({ onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | uploading | error
  const [pct, setPct] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const showToast = useToast();
  const apiDoneRef = useRef(false);
  const pctRef = useRef(0);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setError('That file isn\'t valid JSON. Veridian expects a .json array of transaction objects.');
      return;
    }
    startUpload(file);
  };

  const startUpload = (file) => {
    setPhase('uploading');
    setPct(0);
    setDoneSteps(0);
    setError(null);
    apiDoneRef.current = false;
    pctRef.current = 0;

    // Animate progress independently — parks at 85% until API returns
    const iv = setInterval(() => {
      pctRef.current += 2 + Math.random() * 3;
      if (pctRef.current >= 85 && !apiDoneRef.current) {
        pctRef.current = 85;
      }
      if (pctRef.current >= 100) {
        pctRef.current = 100;
        clearInterval(iv);
      }
      const p = Math.floor(pctRef.current);
      setPct(p);
      setDoneSteps(Math.min(STEPS.length, Math.ceil((p / 100) * STEPS.length)));
    }, 90);

    // Real API call
    uploadTransactions(file)
      .then((data) => {
        apiDoneRef.current = true;
        pctRef.current = 100;
        setPct(100);
        setDoneSteps(STEPS.length);
        setResult(data);
        clearInterval(iv);
        setTimeout(() => {
          showToast(`Batch processed — ${data.flagged_count} transaction${data.flagged_count !== 1 ? 's' : ''} flagged.`);
          onComplete(data);
        }, 700);
      })
      .catch((err) => {
        clearInterval(iv);
        const msg = err.response?.data?.detail || err.message || 'Upload failed.';
        setError(msg);
        setPhase('error');
      });
  };

  const reset = () => {
    setPhase('idle');
    setPct(0);
    setDoneSteps(0);
    setError(null);
    setResult(null);
  };

  return (
    <div className="content-inner fade-up">
      <div className="page-head">
        <div>
          <h1>Upload batch</h1>
          <div className="sub">
            Veridian processes the file as a batch, applying all three fraud rules in one pass.
          </div>
        </div>
      </div>

      <div className="upload-wrap">
        {phase === 'idle' && (
          <>
            <div
              className={`dropzone${drag ? ' drag' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="ring">
                <Icon name="upload" size={26} color="var(--brand)" />
              </div>
              <h2>Drop a transaction file to begin</h2>
              <p>JSON array of transaction objects · all three fraud rules applied in one pass</p>
              <div className="hint">
                or click to select · expects [&#123; transactionId, userId, amount, timestamp &#125;]
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </>
        )}

        {phase === 'uploading' && (
          <div className="processing fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <Icon name="file-json" size={20} color="var(--brand)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Processing transaction file</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>
                    Applying three fraud rules…
                  </div>
                </div>
              </div>
              <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand)' }}>
                {pct}%
              </span>
            </div>
            <div className="proc-bar">
              <i style={{ width: pct + '%' }} />
            </div>
            <div className="proc-log">
              {STEPS.map((s, i) => (
                <div className={`ln${i < doneSteps ? ' done' : ''}`} key={i}>
                  {i < doneSteps
                    ? <Icon name="check" size={13} color="var(--brand)" />
                    : <Icon name="clock" size={13} color="var(--fg-3)" />}
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%', maxWidth: 600 }}>
            <div className="error-state">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
                <Icon name="alert-triangle" size={15} color="var(--danger)" />
                Upload failed
              </div>
              {error}
            </div>
            <Button variant="secondary" icon="refresh-cw" onClick={reset}>Try again</Button>
          </div>
        )}
      </div>
    </div>
  );
}
