import { useState, useMemo } from 'react';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import ZombieSummaryCards from '../components/ZombieSummaryCards';
import ZombieFilterBar from '../components/ZombieFilterBar';
import ZombieTable from '../components/ZombieTable';
import ZombieBulkBar from '../components/ZombieBulkBar';
import ZombieDrawer from '../components/ZombieDrawer';
import ZombieSkeleton from '../components/ZombieSkeleton';
import styles from './ZombieDetector.module.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// idleDays is used for filtering and colour coding.
// costNum is used for sorting and savings calculations.
const MOCK_RESOURCES = [
  {
    id: 'z-1', resourceType: 'EC2', resourceId: 'i-0a3f8c2d91e4b7c12',
    cloud: 'AWS', region: 'us-east-1', idleDays: 63, costNum: 420,
    costPerMonth: '$420', status: 'Zombie', createdDate: 'Nov 12, 2024',
    idleSince: 'Feb 28, 2025',
    aiSummary: 'This EC2 instance has had 0% CPU utilisation and zero network I/O for 63 days. It was provisioned for a load test that was cancelled, and is now entirely idle. Safe to terminate immediately — no other resources depend on it.',
  },
  {
    id: 'z-2', resourceType: 'RDS', resourceId: 'db-prod-analytics-legacy',
    cloud: 'AWS', region: 'us-west-2', idleDays: 112, costNum: 1100,
    costPerMonth: '$1,100', status: 'Zombie', createdDate: 'Aug 5, 2024',
    idleSince: 'Jan 10, 2025',
    aiSummary: 'This RDS instance was the database for the legacy analytics pipeline, which was migrated to BigQuery in January. No connections have been made since the migration date. The instance is consuming $1,100/mo with zero utilisation.',
  },
  {
    id: 'z-3', resourceType: 'Elastic IP', resourceId: '54.214.33.102',
    cloud: 'AWS', region: 'eu-west-1', idleDays: 38, costNum: 14,
    costPerMonth: '$14', status: 'Zombie', createdDate: 'Dec 1, 2024',
    idleSince: 'Mar 25, 2025',
    aiSummary: 'This Elastic IP address is not attached to any running instance or network interface. Unattached Elastic IPs incur a small charge. It appears to have been detached from a terminated test instance and never released.',
  },
  {
    id: 'z-4', resourceType: 'S3', resourceId: 's3://cb-loadtest-artifacts-2024',
    cloud: 'AWS', region: 'us-east-1', idleDays: 91, costNum: 87,
    costPerMonth: '$87', status: 'Marked', createdDate: 'Oct 22, 2024',
    idleSince: 'Jan 31, 2025',
    aiSummary: 'This S3 bucket contains load test artifacts from Q4 2024. There have been zero read or write operations in 91 days. The bucket holds 180 GB of test result files that are unlikely to be needed again.',
  },
  {
    id: 'z-5', resourceType: 'Load Balancer', resourceId: 'k8s-elb-dev-frontend-9a2c',
    cloud: 'AWS', region: 'us-east-2', idleDays: 44, costNum: 220,
    costPerMonth: '$220', status: 'Zombie', createdDate: 'Dec 15, 2024',
    idleSince: 'Mar 19, 2025',
    aiSummary: 'This Application Load Balancer is receiving zero traffic — no target group has any healthy registered targets. It was created for a dev Kubernetes cluster that was decommissioned. The ALB is running fully idle.',
  },
  {
    id: 'z-6', resourceType: 'Compute', resourceId: 'cloudburn-gcp-ml-staging-01',
    cloud: 'GCP', region: 'us-central1', idleDays: 29, costNum: 640,
    costPerMonth: '$640', status: 'Zombie', createdDate: 'Jan 8, 2025',
    idleSince: 'Apr 3, 2025',
    aiSummary: 'This Compute Engine instance was used for ML model staging. The model has since been promoted to production and this instance was not shut down. CPU has been idle for 29 days with no SSH sessions or disk writes.',
  },
  {
    id: 'z-7', resourceType: 'BigQuery', resourceId: 'project/cb-data/dataset/legacy_events',
    cloud: 'GCP', region: 'us', idleDays: 180, costNum: 310,
    costPerMonth: '$310', status: 'Marked', createdDate: 'Jul 1, 2024',
    idleSince: 'Nov 1, 2024',
    aiSummary: 'This BigQuery dataset has not been queried in 180 days and contains data from a deprecated event tracking system. Storage costs continue to accrue. Recommend archiving to Cloud Storage with a lifecycle policy.',
  },
  {
    id: 'z-8', resourceType: 'EC2', resourceId: 'i-0d7e2f4a88b1c3d56',
    cloud: 'AWS', region: 'ap-southeast-1', idleDays: 8, costNum: 180,
    costPerMonth: '$180', status: 'Zombie', createdDate: 'Apr 22, 2025',
    idleSince: 'Apr 24, 2025',
    aiSummary: 'This EC2 instance was recently provisioned but shows signs of being abandoned — it has never served any traffic and has had zero CPU utilisation since creation, apart from the initial boot sequence.',
  },
  {
    id: 'z-9', resourceType: 'RDS', resourceId: 'db-staging-payments-v2',
    cloud: 'Azure', region: 'eastus', idleDays: 55, costNum: 890,
    costPerMonth: '$890', status: 'Cleaned', createdDate: 'Oct 10, 2024',
    idleSince: 'Mar 8, 2025',
    aiSummary: 'This Azure SQL database was used for staging the payments service v2 migration. The migration completed in March and this instance was subsequently terminated. Status: Cleaned.',
  },
];

const DEFAULT_FILTERS = { cloud: '', resourceType: '', idleDuration: '' };
const TABS = ['Active Zombies', 'Pending Cleanup', 'Cleaned'];
const TAB_STATUS = { 'Active Zombies': ['Zombie'], 'Pending Cleanup': ['Marked'], 'Cleaned': ['Cleaned'] };

// Helper: format a number as a $ string
const fmt = (n) => '$' + n.toLocaleString('en-US');

// ─── ZombieDetector Page ──────────────────────────────────────────────────────
export default function ZombieDetector() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const [resources, setResources]               = useState(MOCK_RESOURCES);
  const [loading, setLoading]                   = useState(false);
  const [lastScan, setLastScan]                 = useState('5 minutes ago');
  const [activeTab, setActiveTab]               = useState('Active Zombies');
  const [filters, setFilters]                   = useState(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [drawerResource, setDrawerResource]     = useState(null);
  const [sortKey, setSortKey]                   = useState('idleDays');
  const [sortDesc, setSortDesc]                 = useState(true);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // ── Run Zombie Scan ──────────────────────────────────────────────────────────
  const handleScan = () => {
    setLoading(true);
    setSelectedIds(new Set());
    setTimeout(() => {
      setLastScan('just now');
      setLoading(false);
    }, 2000);
  };

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  // ── Filtering + sorting ──────────────────────────────────────────────────────
  const visibleResources = useMemo(() => {
    const allowedStatuses = TAB_STATUS[activeTab];
    return resources
      .filter((r) => {
        if (!allowedStatuses.includes(r.status))             return false;
        if (filters.cloud && r.cloud !== filters.cloud)      return false;
        if (filters.resourceType && r.resourceType !== filters.resourceType) return false;
        if (filters.idleDuration && r.idleDays < Number(filters.idleDuration)) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'string') return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        return sortDesc ? bVal - aVal : aVal - bVal;
      });
  }, [resources, activeTab, filters, sortKey, sortDesc]);

  // ── Selection ────────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === visibleResources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleResources.map((r) => r.id)));
    }
  };

  // Savings for selected rows
  const selectedSavings = useMemo(() => {
    return resources
      .filter((r) => selectedIds.has(r.id))
      .reduce((sum, r) => sum + r.costNum, 0);
  }, [resources, selectedIds]);

  // ── Resource actions ─────────────────────────────────────────────────────────
  const handleMark = (id) => {
    setResources((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Marked' } : r));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleMarkAll = () => {
    const ids = new Set(selectedIds);
    setResources((prev) => prev.map((r) => ids.has(r.id) ? { ...r, status: 'Marked' } : r));
    setSelectedIds(new Set());
  };

  const handleTerminate = (id) => {
    setResources((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Cleaned' } : r));
  };

  const handleSnooze = (id) => {
    // Snooze: remove from active list for this session
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleIgnore = (id) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExport = () => {
    // In a real app this would trigger a CSV download
    alert(`Exporting ${selectedIds.size} resource(s)…`);
  };

  // ── Summary numbers (Active Zombies + Marked only) ───────────────────────────
  const activeResources = resources.filter((r) => r.status === 'Zombie' || r.status === 'Marked');
  const totalWasted     = activeResources.reduce((s, r) => s + r.costNum, 0);
  const zombieCount     = resources.filter((r) => r.status === 'Zombie').length;
  const pendingCount    = resources.filter((r) => r.status === 'Marked').length;

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
              <h1>Zombie Resource Detector</h1>
              <p>Find and eliminate idle cloud resources wasting your budget</p>
            </div>

            <div className={styles.headerRight}>
              <span className={styles.lastScan}>Last scanned: {lastScan}</span>
              <button
                id="run-zombie-scan-btn"
                className={`${styles.scanBtn} ${loading ? styles.scanning : ''}`}
                onClick={handleScan}
                disabled={loading}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round"/>
                </svg>
                {loading ? 'Scanning...' : 'Run Zombie Scan'}
              </button>
            </div>
          </div>

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
                {tab === 'Active Zombies'   && ` (${zombieCount})`}
                {tab === 'Pending Cleanup'  && ` (${pendingCount})`}
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

          {/* ── Bulk action bar (appears when rows selected) ── */}
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
