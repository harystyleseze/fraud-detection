import { useState, useEffect } from 'react';
import { ToastProvider } from '../components/ToastProvider';
import { Sidebar, Topbar } from './AppShell';
import { OverviewView } from './OverviewView';
import { UploadView } from './UploadView';
import { FlaggedUsersView } from './FlaggedUsersView';
import { BatchesView } from './BatchesView';
import { HeatmapView } from './HeatmapView';
import { getStats } from '../api';

function DashboardInner() {
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState(null);
  const [lastUpload, setLastUpload] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lastUpload')); } catch { return null; }
  });

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  const handleUploadComplete = (result) => {
    setLastUpload(result);
    try { sessionStorage.setItem('lastUpload', JSON.stringify(result)); } catch {}
    getStats().then(setStats).catch(() => {});
    setView('overview');
  };

  const openUser = (userId) => {
    setView('flagged');
  };

  const flaggedCount = lastUpload?.flagged_users?.length ?? 0;

  return (
    <div className="app">
      <Sidebar
        view={view}
        setView={setView}
        flaggedCount={flaggedCount}
      />
      <div className="main">
        <Topbar
          view={view}
          lastUpload={lastUpload}
          onUpload={() => setView('upload')}
        />
        <div className="content">
          {view === 'overview' && (
            <OverviewView
              lastUpload={lastUpload}
              stats={stats}
              onOpenUser={openUser}
              setView={setView}
            />
          )}
          {view === 'flagged' && (
            <FlaggedUsersView lastUpload={lastUpload} />
          )}
          {view === 'heatmap' && (
            <HeatmapView lastUpload={lastUpload} setView={setView} />
          )}
          {view === 'upload' && (
            <UploadView onComplete={handleUploadComplete} />
          )}
          {view === 'batches' && (
            <BatchesView lastUpload={lastUpload} setView={setView} />
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
}
