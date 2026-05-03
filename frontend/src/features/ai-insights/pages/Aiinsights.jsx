import { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import SummaryBar from '../components/SummaryBar';
import InsightFilterBar from '../components/InsightFilterBar';
import InsightCard from '../components/InsightCard';
import InsightSkeleton from '../components/InsightSkeleton';
import useInsights from '../hooks/useInsights';
import styles from './AiInsights.module.css';

const DEFAULT_FILTERS = { priority: '', service: '', sortDesc: true };
const TABS = ['Active Suggestions', 'Applied', 'Dismissed'];
const TAB_STATUS_MAP = {
  'Active Suggestions': 'active',
  'Applied':            'applied',
  'Dismissed':          'dismissed',
};

// ─── Relative time helper ──────────────────────────────────────────────────────
const relativeTime = (isoDate) => {
  if (!isoDate) return 'Never';
  const diffMs  = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} hour${diffH === 1 ? '' : 's'} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD === 1 ? '' : 's'} ago`;
};

// ─── AI Insights Page ─────────────────────────────────────────────────────────
export default function AiInsights() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('My Organisation');
  const [activeTab, setActiveTab]               = useState('Active Suggestions');
  const [filters, setFilters]                   = useState(DEFAULT_FILTERS);
  const [toast, setToast]                       = useState(null); // { msg, type }

  // ── Real data via 4-layer architecture (Redux-only, no local duplicate state)
  const {
    insights,       // directly from Redux — updateInsightStatus modifies these in place
    fetchedAt,
    generatedAt,
    loading,
    error,
    fetchInsights,
    refreshInsights,
    applyInsight,
    dismissInsight,
  } = useInsights();

  // ── Auto-fetch on mount — only if Redux has no data yet ───────────────────
  useEffect(() => {
    if (insights.length === 0) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Run AI Scan — re-fetches and refreshes Redux + InsightCache ──────────
  const handleScan = () => {
    refreshInsights();
  };

  // ── Card action: apply | review | dismiss ─────────────────────────────────
  const handleAction = useCallback((insightId, action) => {
    if (action === 'apply') {
      applyInsight(insightId);
      showToast('✅ Insight marked as applied — visible in the Applied tab');
      setActiveTab('Applied');              // switch tab so user sees it move
    } else if (action === 'dismiss') {
      dismissInsight(insightId);
      showToast('🚫 Insight dismissed — permanently removed');
    } else if (action === 'review') {
      showToast('🔎 Opening AWS Console...', 'info');
      // Hardcoded AWS console link as requested
      window.open('https://console.aws.amazon.com/cost-management/home', '_blank');
    }
  }, [applyInsight, dismissInsight, showToast]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleToggleSort = () =>
    setFilters((prev) => ({ ...prev, sortDesc: !prev.sortDesc }));

  // ── Derived: filtered + sorted insights for the active tab ────────────────
  const visibleInsights = useMemo(() => {
    const targetStatus = TAB_STATUS_MAP[activeTab];
    return [...insights]
      .filter((ins) => {
        if (ins.status !== targetStatus)                          return false;
        if (filters.priority && ins.priority !== filters.priority) return false;
        if (filters.service  && ins.service  !== filters.service)  return false;
        return true;
      })
      .sort((a, b) =>
        filters.sortDesc ? b.savingsNum - a.savingsNum : a.savingsNum - b.savingsNum,
      );
  }, [insights, activeTab, filters]);

  // ── Summary bar values ─────────────────────────────────────────────────────
  const activeInsights = insights.filter((i) => i.status === 'active');
  const appliedCount   = insights.filter((i) => i.status === 'applied').length;
  const dismissedCount = insights.filter((i) => i.status === 'dismissed').length;
  const totalSavings   = activeInsights.reduce((sum, i) => sum + (i.savingsNum || 0), 0);
  const fmt            = (n) => '$' + n.toLocaleString('en-US');

  // ── Group insights by category for the Active tab ─────────────────────────
  const groupedInsights = useMemo(() => {
    if (activeTab !== 'Active Suggestions') return null;
    const groups = {};
    visibleInsights.forEach((ins) => {
      if (!groups[ins.group]) groups[ins.group] = [];
      groups[ins.group].push(ins);
    });
    return groups;
  }, [visibleInsights, activeTab]);

  // ── Tab label helper ──────────────────────────────────────────────────────
  const tabLabel = (tab) => {
    if (tab === 'Active Suggestions') return `${tab} (${activeInsights.length})`;
    if (tab === 'Applied')            return `${tab} (${appliedCount})`;
    if (tab === 'Dismissed')          return `${tab} (${dismissedCount})`;
    return tab;
  };

  return (
    <div className={styles.page}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header
          currentOrg={currentOrg}
          organizations={['My Organisation']}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>

          {/* Toast notification */}
          {toast && (
            <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
              {toast.msg}
            </div>
          )}

          {/* Page heading + Scan button */}
          <div className={styles.pageHeader}>
            <div>
              <h1>AI Insights</h1>
              <p>AI-powered suggestions based on your real AWS billing data</p>
            </div>
            <button
              id="run-ai-scan-btn"
              className={`${styles.scanBtn} ${loading ? styles.scanning : ''}`}
              onClick={handleScan}
              disabled={loading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round"/>
              </svg>
              {loading ? 'Analysing...' : 'Run AI Scan'}
            </button>
          </div>

          {/* Error state */}
          {error && !loading && (
            <div className={styles.errorState}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Top summary bar */}
          {!error && (
            <SummaryBar
              totalSavings={fmt(totalSavings)}
              suggestionCount={activeInsights.length}
              lastScan={relativeTime(generatedAt || fetchedAt)}
            />
          )}

          {/* Tabs — show live counts */}
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <InsightFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onToggleSort={handleToggleSort}
          />

          {/* Loading skeleton */}
          {loading && <InsightSkeleton count={4} />}

          {/* Empty state */}
          {!loading && !error && visibleInsights.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>
                {activeTab === 'Active Suggestions'
                  ? insights.length === 0
                    ? 'Run an AI Scan to generate insights from your billing data'
                    : 'No active suggestions — all done!'
                  : `No ${activeTab.toLowerCase()} suggestions yet`}
              </p>
              <p className={styles.emptySubtitle}>
                {activeTab === 'Active Suggestions'
                  ? insights.length === 0
                    ? 'Click "Run AI Scan" above. Make sure billing data has been fetched first.'
                    : 'All suggestions have been applied or dismissed.'
                  : 'Nothing here yet.'}
              </p>
            </div>
          )}

          {/* Active Suggestions — grouped by category */}
          {!loading && activeTab === 'Active Suggestions' && groupedInsights &&
            Object.entries(groupedInsights).map(([groupName, cards]) => (
              <div key={groupName}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupLabel}>{groupName}</span>
                  <div className={styles.groupLine} />
                </div>
                <div className={styles.cardGrid}>
                  {cards.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            ))
          }

          {/* Applied / Dismissed — flat grid */}
          {!loading && activeTab !== 'Active Suggestions' && visibleInsights.length > 0 && (
            <div className={styles.cardGrid}>
              {visibleInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
