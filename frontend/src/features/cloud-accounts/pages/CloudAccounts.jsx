import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAccounts, setSyncLog, updateAccount, removeAccount, addSyncLog } from '../cloudAccounts.slice';
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
import { getCloudAccountsApi } from '../cloudAccounts.api.js';

// MOCK_ACCOUNTS removed as we will fetch from backend

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
  const dispatch = useDispatch();
  const { accounts, syncLog, loading } = useSelector((state) => state.cloudAccounts);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const [editingAccount, setEditingAccount]     = useState(null);  // account in drawer
  const [removingAccount, setRemovingAccount]   = useState(null);  // account in modal
  const [bannerDismissed, setBannerDismissed]   = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await getCloudAccountsApi();
        const data = res.data?.data?.accounts || [];
        dispatch(setAccounts(data));
      } catch (err) {
        console.error("Failed to fetch cloud accounts:", err);
      }
    };
    fetchAccounts();

    if (syncLog.length === 0) dispatch(setSyncLog(INITIAL_SYNC_LOG));
  }, [dispatch, syncLog.length]);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeAccounts = accounts.filter(a => a.status !== 'Coming Soon');
  const totalSpend     = activeAccounts.reduce((s, a) => s + parseInt(String(a.mtdSpend).replace(/[$,]/g, '') || 0, 10), 0);
  const needsAttention = activeAccounts.filter((a) => a.status === 'Error' || a.status === 'Expiring Soon' || a.status === 'Expired').length;

  // Show expiry banner if any account is expiring/expired and not dismissed
  const expiringAccount = useMemo(() => activeAccounts.find((a) => a.status === 'Expiring Soon'), [activeAccounts]);
  const showBanner = !bannerDismissed && !!expiringAccount;

  // ── Sync Now ────────────────────────────────────────────────────────────────
  const handleSync = (id) => {
    // Set card to "Syncing"
    const accToUpdate = accounts.find(a => a.id === id);
    if (accToUpdate) dispatch(updateAccount({ ...accToUpdate, status: 'Syncing' }));

    // After 2.5s simulate success
    setTimeout(() => {
      const syncedAcc = { ...accToUpdate, status: 'Active', lastSynced: 'just now' };
      dispatch(updateAccount(syncedAcc));
      
      // Prepend to sync log
      dispatch(addSyncLog({
        id: `sl-new-${Date.now()}`,
        accountName: syncedAcc.name,
        provider: syncedAcc.provider,
        result: 'success',
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      }));
    }, 2500);
  };

  // ── Save edit ───────────────────────────────────────────────────────────────
  const handleSave = (updated) => {
    dispatch(updateAccount(updated));
  };

  // ── Remove account ──────────────────────────────────────────────────────────
  const handleRemove = (id) => {
    dispatch(removeAccount(id));
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
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
          onMenuClick={() => setMobileSidebarOpen(true)}
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
            totalAccounts={activeAccounts.length}
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
