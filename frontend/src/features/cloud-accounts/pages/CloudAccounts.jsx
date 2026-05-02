import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import AccountStatsBar from '../components/AccountStatsBar';
import AccountCard from '../components/AccountCard';
import AddAccountCard from '../components/AddAccountCard';
import ExpiryBanner from '../components/ExpiryBanner';
import SyncHistory from '../components/SyncHistory';
import AccountEditDrawer from '../components/AccountEditDrawer';
import RemoveModal from '../components/RemoveModal';
import AccountSkeleton from '../components/AccountSkeleton';
import styles from './CloudAccounts.module.css';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
// credHealth: { status: 'healthy'|'expiring'|'expired', label, pct }
const MOCK_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Production AWS',
    provider: 'AWS',
    accountId: '123456789012',
    regions: ['us-east-1', 'us-west-2'],
    mtdSpend: '$24,840',
    lastSynced: '2 min ago',
    status: 'Active',
    credHealth: { status: 'healthy', label: 'Healthy', pct: 100 },
  },
  {
    id: 'acc-2',
    name: 'Analytics GCP',
    provider: 'GCP',
    accountId: 'cb-analytics-prod-9812',
    regions: ['us-central1', 'europe-west1'],
    mtdSpend: '$18,430',
    lastSynced: '8 min ago',
    status: 'Active',
    credHealth: { status: 'healthy', label: 'Healthy', pct: 100 },
  },
  {
    id: 'acc-3',
    name: 'Staging Azure',
    provider: 'Azure',
    accountId: 'sub-4f7a-8b2c-1d9e',
    regions: ['eastus', 'westeurope'],
    mtdSpend: '$8,560',
    lastSynced: '3 hours ago',
    status: 'Expiring Soon',
    credHealth: { status: 'expiring', label: 'Expiring in 3 days', pct: 15 },
  },
  {
    id: 'acc-4',
    name: 'Dev AWS East',
    provider: 'AWS',
    accountId: '987654321098',
    regions: ['eu-west-1'],
    mtdSpend: '$3,210',
    lastSynced: '3 hours ago',
    status: 'Error',
    credHealth: { status: 'expired', label: 'Credentials expired', pct: 0 },
  },
];

// Sync history log (newest first)
const INITIAL_SYNC_LOG = [
  { id: 'sl-1', accountName: 'Production AWS',  provider: 'AWS',   result: 'success', timestamp: 'May 2, 2025 · 10:41 AM' },
  { id: 'sl-2', accountName: 'Analytics GCP',   provider: 'GCP',   result: 'success', timestamp: 'May 2, 2025 · 10:35 AM' },
  { id: 'sl-3', accountName: 'Dev AWS East',     provider: 'AWS',   result: 'failed',  timestamp: 'May 2, 2025 · 07:12 AM' },
  { id: 'sl-4', accountName: 'Staging Azure',    provider: 'Azure', result: 'success', timestamp: 'May 1, 2025 · 11:58 PM' },
  { id: 'sl-5', accountName: 'Production AWS',   provider: 'AWS',   result: 'success', timestamp: 'May 1, 2025 · 10:40 AM' },
  { id: 'sl-6', accountName: 'Analytics GCP',    provider: 'GCP',   result: 'success', timestamp: 'May 1, 2025 · 10:33 AM' },
  { id: 'sl-7', accountName: 'Dev AWS East',      provider: 'AWS',   result: 'failed',  timestamp: 'Apr 30, 2025 · 06:55 AM' },
];

// ─── CloudAccounts Page ────────────────────────────────────────────────────────
export default function CloudAccounts() {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const [accounts, setAccounts]                 = useState(MOCK_ACCOUNTS);
  const [syncLog, setSyncLog]                   = useState(INITIAL_SYNC_LOG);
  const [loading, setLoading]                   = useState(false);
  const [editingAccount, setEditingAccount]     = useState(null);  // account in drawer
  const [removingAccount, setRemovingAccount]   = useState(null);  // account in modal
  const [bannerDismissed, setBannerDismissed]   = useState(false);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSpend     = accounts.reduce((s, a) => s + parseInt(a.mtdSpend.replace(/[$,]/g, ''), 10), 0);
  const needsAttention = accounts.filter((a) => a.status === 'Error' || a.status === 'Expiring Soon' || a.status === 'Expired').length;

  // Show expiry banner if any account is expiring/expired and not dismissed
  const expiringAccount = useMemo(() => accounts.find((a) => a.status === 'Expiring Soon'), [accounts]);
  const showBanner = !bannerDismissed && !!expiringAccount;

  // ── Sync Now ────────────────────────────────────────────────────────────────
  const handleSync = (id) => {
    // Set card to "Syncing"
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'Syncing' } : a));
    // After 2.5s simulate success
    setTimeout(() => {
      setAccounts((prev) => prev.map((a) =>
        a.id === id ? { ...a, status: 'Active', lastSynced: 'just now' } : a
      ));
      // Prepend to sync log
      const acc = accounts.find((a) => a.id === id);
      if (acc) {
        setSyncLog((prev) => [{
          id: `sl-new-${Date.now()}`,
          accountName: acc.name,
          provider: acc.provider,
          result: 'success',
          timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        }, ...prev.slice(0, 9)]);
      }
    }, 2500);
  };

  // ── Save edit ───────────────────────────────────────────────────────────────
  const handleSave = (updated) => {
    setAccounts((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  };

  // ── Remove account ──────────────────────────────────────────────────────────
  const handleRemove = (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Retry sync from log ─────────────────────────────────────────────────────
  const handleRetrySyncFromLog = (logId) => {
    const entry = syncLog.find((e) => e.id === logId);
    if (!entry) return;
    const acc = accounts.find((a) => a.name === entry.accountName);
    if (acc) handleSync(acc.id);
  };

  // ── Navigate to Connect flow ────────────────────────────────────────────────
  const handleConnectNew = () => navigate('/connect');

  // Format total spend
  const fmt = (n) => '$' + n.toLocaleString('en-US');

  return (
    <div className={styles.page}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>

          {/* ── Page heading ── */}
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderLeft}>
              <h1>Cloud Accounts</h1>
              <p>Manage your connected cloud providers</p>
            </div>
            <button id="connect-new-btn" className={styles.connectBtn} onClick={handleConnectNew}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Connect New Account
            </button>
          </div>

          {/* ── Expiry banner ── */}
          {showBanner && (
            <ExpiryBanner
              message={`${expiringAccount.name} credentials expiring in 3 days`}
              onUpdate={() => setEditingAccount(expiringAccount)}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

          {/* ── Top stats ── */}
          <AccountStatsBar
            totalAccounts={accounts.length}
            totalSpend={fmt(totalSpend)}
            needsAttention={needsAttention}
          />

          {/* ── Connected Accounts ── */}
          <p className={styles.sectionLabel}>Connected Accounts</p>

          {loading ? (
            <AccountSkeleton count={4} />
          ) : (
            <div className={styles.accountGrid}>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={setEditingAccount}
                  onRemove={setRemovingAccount}
                  onSync={handleSync}
                />
              ))}

              {/* Dashed "add new" card always at the end */}
              <AddAccountCard onClick={handleConnectNew} />
            </div>
          )}

          {/* ── Sync History ── */}
          <p className={styles.sectionLabel}>Recent Sync Activity</p>
          <SyncHistory entries={syncLog} onRetry={handleRetrySyncFromLog} />

        </div>
      </div>

      {/* ── Edit Drawer ── */}
      {editingAccount && (
        <AccountEditDrawer
          account={editingAccount}
          onSave={handleSave}
          onClose={() => setEditingAccount(null)}
        />
      )}

      {/* ── Remove Modal ── */}
      {removingAccount && (
        <RemoveModal
          account={removingAccount}
          onConfirm={handleRemove}
          onClose={() => setRemovingAccount(null)}
        />
      )}
    </div>
  );
}
