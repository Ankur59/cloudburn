import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setResources, setTotal, setLastScan, setLoading, setScanLoading, setError,
  updateResourceStatus, removeResource,
  markResource, markResourcesBulk, terminateResource,
} from '../zombieDetector.slice';
import { getZombiesApi, triggerScanApi, updateZombieStatusApi } from '../zombie.api';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import ZombieSummaryCards from '../components/ZombieSummaryCards';
import ZombieFilterBar from '../components/ZombieFilterBar';
import ZombieTable from '../components/ZombieTable';
import ZombieBulkBar from '../components/ZombieBulkBar';
import ZombieDrawer from '../components/ZombieDrawer';
import ZombieSkeleton from '../components/ZombieSkeleton';
import styles from './ZombieDetector.module.css';

const DEFAULT_FILTERS = { cloud: '', resourceType: '', idleDuration: '' };
const TABS = ['Active Zombies', 'Pending Cleanup', 'Cleaned'];
const TAB_STATUS = { 'Active Zombies': ['zombie'], 'Pending Cleanup': ['marked'], 'Cleaned': ['cleaned'] };

// Map backend fields → UI shape expected by existing components
const normalizeResource = (r) => ({
  ...r,
  id:           r._id,
  resourceType: r.service,
  cloud:        r.provider?.toUpperCase() ?? 'AWS',
  costNum:      r.estimatedMonthlyCost ?? 0,
  costPerMonth: `$${(r.estimatedMonthlyCost ?? 0).toLocaleString('en-US')}`,
  idleDays:     r.idleDays ?? 0,
  createdDate:  r.detectedAt ? new Date(r.detectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  idleSince:    r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  // Capitalize status to match existing TAB_STATUS keys
  status: r.status
    ? r.status.charAt(0).toUpperCase() + r.status.slice(1)
    : 'Zombie',
  aiSummary:    r.aiSummary || `This ${r.service} resource (${r.resourceId}) has been idle for ${r.idleDays} day(s) with no meaningful activity detected.`,
});

const fmt = (n) => '$' + n.toLocaleString('en-US');

// ─── ZombieDetector Page ──────────────────────────────────────────────────────
export default function ZombieDetector() {
  const dispatch = useDispatch();
  const { resources, lastScan, loading, scanLoading, error } = useSelector(
    (state) => state.zombieDetector
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const organizations = ['Acme Corporation', 'Globex Inc', 'Soylent Corp'];
  const [activeTab, setActiveTab]               = useState('Active Zombies');
  const [filters, setFilters]                   = useState(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [drawerResource, setDrawerResource]     = useState(null);
  const [sortKey, setSortKey]                   = useState('idleDays');
  const [sortDesc, setSortDesc]                 = useState(true);

  // ── Fetch on mount ───────────────────────────────────────────────────────────
  const fetchZombies = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const res = await getZombiesApi();
      const data = res.data?.data;
      dispatch(setResources((data?.resources ?? []).map(normalizeResource)));
      dispatch(setTotal(data?.total ?? 0));
      if (data?.scannedAt) dispatch(setLastScan(data.scannedAt));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message ?? 'Failed to load zombie resources.'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchZombies();
  }, [fetchZombies]);

  // ── Format last scan time ────────────────────────────────────────────────────
  const lastScanLabel = useMemo(() => {
    if (!lastScan) return 'Never';
    const diff = Math.round((Date.now() - new Date(lastScan).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} min ago`;
    return new Date(lastScan).toLocaleTimeString();
  }, [lastScan]);

  // ── Run On-Demand Scan ───────────────────────────────────────────────────────
  const handleScan = async () => {
    dispatch(setScanLoading(true));
    setSelectedIds(new Set());
    try {
      const res = await triggerScanApi();
      const data = res.data?.data;
      dispatch(setResources((data?.resources ?? []).map(normalizeResource)));
      dispatch(setTotal(data?.total ?? 0));
      dispatch(setLastScan(data?.scannedAt ?? new Date().toISOString()));
    } catch (err) {
      dispatch(setError(err?.response?.data?.message ?? 'Scan failed.'));
    } finally {
      dispatch(setScanLoading(false));
    }
  };

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) { setSortDesc((d) => !d); } else { setSortKey(key); setSortDesc(true); }
  };

  // ── Filtering + sorting ──────────────────────────────────────────────────────
  const visibleResources = useMemo(() => {
    const allowedStatuses = TAB_STATUS[activeTab];
    return resources
      .filter((r) => {
        if (!allowedStatuses.includes(r.status?.toLowerCase())) return false;
        if (filters.cloud && r.cloud !== filters.cloud)                return false;
        if (filters.resourceType && r.resourceType !== filters.resourceType) return false;
        if (filters.idleDuration && r.idleDays < Number(filters.idleDuration)) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortKey], bVal = b[sortKey];
        if (typeof aVal === 'string') return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        return sortDesc ? bVal - aVal : aVal - bVal;
      });
  }, [resources, activeTab, filters, sortKey, sortDesc]);

  // ── Selection ────────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const handleToggleSelectAll = () => {
    selectedIds.size === visibleResources.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(visibleResources.map((r) => r.id)));
  };
  const selectedSavings = useMemo(() =>
    resources.filter((r) => selectedIds.has(r.id)).reduce((s, r) => s + r.costNum, 0),
    [resources, selectedIds]
  );

  // ── Resource actions (optimistic + API sync) ─────────────────────────────────
  const handleMark = async (id) => {
    dispatch(markResource(id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    try { await updateZombieStatusApi(id, 'marked'); } catch { fetchZombies(); }
  };

  const handleMarkAll = async () => {
    const ids = Array.from(selectedIds);
    dispatch(markResourcesBulk(ids));
    setSelectedIds(new Set());
    try {
      await Promise.all(ids.map((id) => updateZombieStatusApi(id, 'marked')));
    } catch { fetchZombies(); }
  };

  const handleTerminate = async (id) => {
    dispatch(terminateResource(id));
    try { await updateZombieStatusApi(id, 'cleaned'); } catch { fetchZombies(); }
  };

  const handleSnooze = (id) => dispatch(removeResource(id));
  const handleIgnore = (id) => dispatch(removeResource(id));

  const handleExport = () => alert(`Exporting ${selectedIds.size} resource(s)…`);

  // ── Summary numbers ──────────────────────────────────────────────────────────
  const activeResources = resources.filter((r) => ['zombie', 'marked'].includes(r.status?.toLowerCase()));
  const totalWasted     = activeResources.reduce((s, r) => s + r.costNum, 0);
  const zombieCount     = resources.filter((r) => r.status?.toLowerCase() === 'zombie').length;
  const pendingCount    = resources.filter((r) => r.status?.toLowerCase() === 'marked').length;

  const isScanning = scanLoading;

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
              <h1>Zombie Resource Detector</h1>
              <p>Find and eliminate idle cloud resources wasting your budget</p>
            </div>
            <div className={styles.headerRight}>
              <span className={styles.lastScan}>Last scanned: {lastScanLabel}</span>
              <button
                id="run-zombie-scan-btn"
                className={`${styles.scanBtn} ${isScanning ? styles.scanning : ''}`}
                onClick={handleScan}
                disabled={isScanning || loading}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round"/>
                </svg>
                {isScanning ? 'Scanning...' : 'Run Zombie Scan'}
              </button>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* ── Summary cards ── */}
          <ZombieSummaryCards
            totalWasted={fmt(totalWasted)}
            zombieCount={zombieCount}
            potentialSavings={fmt(totalWasted)}
          />

          {/* ── Tabs ── */}
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`zombie-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
              >
                {tab}
                {tab === 'Active Zombies'  && ` (${zombieCount})`}
                {tab === 'Pending Cleanup' && ` (${pendingCount})`}
              </button>
            ))}
          </div>

          {/* ── Filter bar ── */}
          <ZombieFilterBar
            filters={filters}
            onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />

          {/* ── Table area ── */}
          {loading ? (
            <ZombieSkeleton count={6} />
          ) : visibleResources.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎉</span>
              <p className={styles.emptyTitle}>No zombies detected — your cloud is clean</p>
              <p className={styles.emptySubtitle}>All resources are actively being used. Run a scan anytime to check for new zombies.</p>
            </div>
          ) : (
            <ZombieTable
              resources={visibleResources}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onReview={setDrawerResource}
              onMark={handleMark}
              sortKey={sortKey}
              sortDesc={sortDesc}
              onSort={handleSort}
            />
          )}

          {/* ── Bulk action bar ── */}
          {selectedIds.size > 0 && (
            <ZombieBulkBar
              selectedCount={selectedIds.size}
              totalSavings={fmt(selectedSavings)}
              onMarkAll={handleMarkAll}
              onExport={handleExport}
              onClearSelection={() => setSelectedIds(new Set())}
            />
          )}
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {drawerResource && (
        <ZombieDrawer
          resource={drawerResource}
          onClose={() => setDrawerResource(null)}
          onTerminate={handleTerminate}
          onSnooze={handleSnooze}
          onIgnore={handleIgnore}
        />
      )}
    </div>
  );
}
