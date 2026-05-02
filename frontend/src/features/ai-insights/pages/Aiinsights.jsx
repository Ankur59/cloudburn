import { useState, useMemo } from 'react';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import SummaryBar from '../components/SummaryBar';
import InsightFilterBar from '../components/InsightFilterBar';
import InsightCard from '../components/InsightCard';
import InsightSkeleton from '../components/InsightSkeleton';
import styles from './Aiinsights.module.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// savingsNum is a plain number used for sorting.
// savings is the formatted string shown in the UI.
const INITIAL_INSIGHTS = [
  // ── Cost Optimization ─────────────────────────────────────────────────────
  {
    id: 'ins-1',
    group: 'Cost Optimization',
    title: 'Switch EC2 instances to Savings Plan',
    service: 'AWS · EC2',
    explanation:
      'Your Platform Engineering team has been running 12 on-demand m5.2xlarge instances at full capacity for 3+ months. Committing to a 1-year Compute Savings Plan would lock in a 40% discount with no architecture changes required.',
    savings: '$3,840/mo',
    savingsNum: 3840,
    confidence: 94,
    priority: 'critical',
    actionLabel: 'Apply Optimization',
    isNew: true,
    status: 'active',
  },
  {
    id: 'ins-2',
    group: 'Cost Optimization',
    title: 'Right-size underutilised RDS instances',
    service: 'AWS · RDS',
    explanation:
      'Three RDS db.r5.2xlarge instances are running at an average of 8% CPU utilisation. Downsizing to db.r5.large would reduce compute costs by 70% while comfortably handling the observed query load.',
    savings: '$2,100/mo',
    savingsNum: 2100,
    confidence: 88,
    priority: 'high',
    actionLabel: 'Apply Optimization',
    isNew: true,
    status: 'active',
  },
  {
    id: 'ins-3',
    group: 'Cost Optimization',
    title: 'Remove orphaned S3 buckets',
    service: 'AWS · S3',
    explanation:
      'We detected 14 S3 buckets with zero GET/PUT activity in the last 60 days that are still incurring storage costs. These appear to be leftover from deprecated projects and are safe to archive or delete.',
    savings: '$420/mo',
    savingsNum: 420,
    confidence: 97,
    priority: 'high',
    actionLabel: 'Review Resource',
    isNew: false,
    status: 'active',
  },
  {
    id: 'ins-4',
    group: 'Cost Optimization',
    title: 'Optimise BigQuery query patterns',
    service: 'GCP · BigQuery',
    explanation:
      'The ETL pipeline is running full table scans on a 2TB dataset every 15 minutes. Adding a partition filter on the event_date column would reduce bytes billed by an estimated 85%, dramatically cutting query costs.',
    savings: '$4,200/mo',
    savingsNum: 4200,
    confidence: 91,
    priority: 'critical',
    actionLabel: 'Review Resource',
    isNew: false,
    status: 'active',
  },

  // ── Performance ────────────────────────────────────────────────────────────
  {
    id: 'ins-5',
    group: 'Performance',
    title: 'Enable CDN for S3 static assets',
    service: 'AWS · S3',
    explanation:
      'Your application fetches large static assets directly from S3 on every request instead of routing through CloudFront. Enabling the CDN would reduce latency by 60% and cut S3 egress costs.',
    savings: '$680/mo',
    savingsNum: 680,
    confidence: 85,
    priority: 'high',
    actionLabel: 'Apply Optimization',
    isNew: true,
    status: 'active',
  },
  {
    id: 'ins-6',
    group: 'Performance',
    title: 'Fix Azure Functions retry loop',
    service: 'Azure · Functions',
    explanation:
      'The fn-order-processor function is retrying failed jobs 50 times before timing out due to a missing dead-letter queue configuration. This inflates execution counts by 50x and slows downstream services.',
    savings: '$610/mo',
    savingsNum: 610,
    confidence: 99,
    priority: 'critical',
    actionLabel: 'Review Resource',
    isNew: true,
    status: 'active',
  },

  // ── Security ───────────────────────────────────────────────────────────────
  {
    id: 'ins-7',
    group: 'Security',
    title: 'Rotate exposed IAM access keys',
    service: 'AWS · EC2',
    explanation:
      'Two IAM access keys have not been rotated in over 180 days and were recently found in a public GitHub commit (now reverted). These keys have broad EC2 permissions. Immediate rotation is strongly recommended.',
    savings: '$0/mo',
    savingsNum: 0,
    confidence: 100,
    priority: 'critical',
    actionLabel: 'Review Resource',
    isNew: true,
    status: 'active',
  },
  {
    id: 'ins-8',
    group: 'Security',
    title: 'Enable GCP audit logging on Compute',
    service: 'GCP · Compute',
    explanation:
      'Data Access audit logs are disabled for the production Compute Engine project. Enabling them is a compliance requirement under SOC 2 Type II and gives full visibility into API calls made to your infrastructure.',
    savings: '$0/mo',
    savingsNum: 0,
    confidence: 90,
    priority: 'high',
    actionLabel: 'Apply Optimization',
    isNew: false,
    status: 'active',
  },

  // ── Applied ────────────────────────────────────────────────────────────────
  {
    id: 'ins-9',
    group: 'Cost Optimization',
    title: 'Enabled S3 Intelligent-Tiering',
    service: 'AWS · S3',
    explanation:
      'S3 Intelligent-Tiering was applied to the media-uploads bucket, automatically moving infrequently accessed objects to cheaper storage tiers. This optimisation is now live.',
    savings: '$240/mo',
    savingsNum: 240,
    confidence: 95,
    priority: 'low',
    actionLabel: 'Applied',
    isNew: false,
    status: 'applied',
  },

  // ── Dismissed ─────────────────────────────────────────────────────────────
  {
    id: 'ins-10',
    group: 'Cost Optimization',
    title: 'Migrate to ARM-based instances',
    service: 'AWS · EC2',
    explanation:
      'Migrating the API fleet from x86 to Graviton3 instances would yield a 20% cost reduction. Dismissed because the app has a dependency on an x86-only library.',
    savings: '$1,100/mo',
    savingsNum: 1100,
    confidence: 78,
    priority: 'high',
    actionLabel: 'Apply Optimization',
    isNew: false,
    status: 'dismissed',
  },
];

const DEFAULT_FILTERS = { priority: '', service: '', sortDesc: true };
const TABS = ['Active Suggestions', 'Applied', 'Dismissed'];
const TAB_STATUS_MAP = {
  'Active Suggestions': 'active',
  'Applied':            'applied',
  'Dismissed':          'dismissed',
};

// ─── AI Insights Page ─────────────────────────────────────────────────────────
export default function AiInsights() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const [insights, setInsights]                 = useState(INITIAL_INSIGHTS);
  const [loading, setLoading]                   = useState(false);
  const [lastScan, setLastScan]                 = useState('2 minutes ago');
  const [activeTab, setActiveTab]               = useState('Active Suggestions');
  const [filters, setFilters]                   = useState(DEFAULT_FILTERS);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // ── Run AI Scan: show skeleton for 2s, then mark all active as new ─────────
  const handleScan = () => {
    setLoading(true);
    setTimeout(() => {
      setInsights((prev) =>
        prev.map((ins) => (ins.status === 'active' ? { ...ins, isNew: true } : ins))
      );
      setLastScan('just now');
      setLoading(false);
    }, 2000);
  };

  // ── Card action: apply or dismiss an insight ───────────────────────────────
  const handleAction = (insightId, action) => {
    if (action === 'apply') {
      setInsights((prev) =>
        prev.map((ins) =>
          ins.id === insightId ? { ...ins, status: 'applied', isNew: false } : ins
        )
      );
    } else if (action === 'dismiss') {
      setInsights((prev) =>
        prev.map((ins) =>
          ins.id === insightId ? { ...ins, status: 'dismissed', isNew: false } : ins
        )
      );
    }
    // 'review' — no state change in this mock
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleSort = () => {
    setFilters((prev) => ({ ...prev, sortDesc: !prev.sortDesc }));
  };

  // ── Derived: filtered + sorted insights for the active tab ────────────────
  const visibleInsights = useMemo(() => {
    const targetStatus = TAB_STATUS_MAP[activeTab];
    return insights
      .filter((ins) => {
        if (ins.status !== targetStatus)                      return false;
        if (filters.priority && ins.priority !== filters.priority) return false;
        if (filters.service  && ins.service  !== filters.service)  return false;
        return true;
      })
      .sort((a, b) =>
        filters.sortDesc ? b.savingsNum - a.savingsNum : a.savingsNum - b.savingsNum
      );
  }, [insights, activeTab, filters]);

  // ── Summary bar values ─────────────────────────────────────────────────────
  const activeInsights = insights.filter((i) => i.status === 'active');
  const totalSavings   = activeInsights.reduce((sum, i) => sum + i.savingsNum, 0);
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
          {/* Page heading + Scan button */}
          <div className={styles.pageHeader}>
            <div>
              <h1>AI Insights</h1>
              <p>Claude AI-powered suggestions to optimise your cloud spend</p>
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
              {loading ? 'Scanning...' : 'Run AI Scan'}
            </button>
          </div>

          {/* Top summary bar */}
          <SummaryBar
            totalSavings={fmt(totalSavings)}
            suggestionCount={activeInsights.length}
            lastScan={lastScan}
          />

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}{tab === 'Active Suggestions' ? ` (${activeInsights.length})` : ''}
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
          {!loading && visibleInsights.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>
                {activeTab === 'Active Suggestions'
                  ? 'No optimizations found — your cloud is running efficiently'
                  : `No ${activeTab.toLowerCase()} suggestions`}
              </p>
              <p className={styles.emptySubtitle}>
                {activeTab === 'Active Suggestions'
                  ? 'Run a new scan to check for fresh opportunities.'
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
                    <InsightCard key={insight.id} insight={insight} onAction={handleAction} />
                  ))}
                </div>
              </div>
            ))
          }

          {/* Applied / Dismissed — flat grid */}
          {!loading && activeTab !== 'Active Suggestions' && visibleInsights.length > 0 && (
            <div className={styles.cardGrid}>
              {visibleInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onAction={handleAction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
