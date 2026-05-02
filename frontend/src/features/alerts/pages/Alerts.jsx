import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import AlertFilterBar from '../components/AlertFilterBar';
import AlertList from '../components/AlertList';
import AlertSkeleton from '../components/AlertSkeleton';
import styles from './Alerts.module.css';

// ─── Mock Data ───────────────────────────────────────────────────────────────
// In a real app, this would come from an API call.
// Shape of each alert object is documented here for clarity.
const MOCK_ALERTS = [
  {
    id: 'alert-1',
    severity: 'critical',             // 'critical' | 'warning'
    type: 'Spike',                    // 'Spike' | 'Budget Breach' | 'Anomaly'
    title: 'EC2 Compute Cost Spike Detected',
    service: 'AWS · EC2',
    provider: 'AWS',
    timestamp: '2026-05-02 · 08:42 AM',
    costImpact: '$3,240 / day',
    status: 'Active',                 // 'Active' | 'Resolved'
    rootCause:
      'A fleet of m5.4xlarge instances was auto-scaled to 48 units due to a misconfigured scale-out policy. The threshold was set to 20% CPU instead of 80%, causing excessive scaling during normal traffic.',
    resources: [
      { name: 'i-0abc1234 (m5.4xlarge)', cost: '+$1,120/day' },
      { name: 'i-0def5678 (m5.4xlarge)', cost: '+$1,120/day' },
      { name: 'i-0ghi9012 (m5.2xlarge)', cost: '+$1,000/day' },
    ],
  },
  {
    id: 'alert-2',
    severity: 'critical',
    type: 'Budget Breach',
    title: 'Monthly Budget Limit Exceeded — Production',
    service: 'GCP · Compute Engine',
    provider: 'GCP',
    timestamp: '2026-05-02 · 07:15 AM',
    costImpact: '$8,500 over budget',
    status: 'Active',
    rootCause:
      'The Production workspace has exceeded its $40,000 monthly budget by $8,500. The primary driver is unoptimized BigQuery jobs running full table scans on a 2TB dataset every 15 minutes.',
    resources: [
      { name: 'bigquery-prod-etl-job', cost: '+$4,200/day' },
      { name: 'compute-engine-prod-01', cost: '+$890/day' },
    ],
  },
  {
    id: 'alert-3',
    severity: 'warning',
    type: 'Anomaly',
    title: 'Unusual Data Transfer Activity — S3 Buckets',
    service: 'AWS · S3',
    provider: 'AWS',
    timestamp: '2026-05-02 · 06:30 AM',
    costImpact: '$420 / day',
    status: 'Active',
    rootCause:
      'S3 egress costs are 340% above the 30-day baseline. This appears to be caused by a new deployment that is fetching large static assets from S3 on every request instead of using the CloudFront CDN.',
    resources: [
      { name: 's3://prod-assets-bucket', cost: '+$280/day' },
      { name: 's3://media-uploads-bucket', cost: '+$140/day' },
    ],
  },
  {
    id: 'alert-4',
    severity: 'warning',
    type: 'Spike',
    title: 'Azure Functions Execution Count Spike',
    service: 'Azure · Functions',
    provider: 'Azure',
    timestamp: '2026-05-01 · 11:58 PM',
    costImpact: '$610 / day',
    status: 'Active',
    rootCause:
      'A retry loop bug introduced in the v2.4.1 deployment is causing Azure Functions to re-execute failed jobs in an infinite loop. Each failed invocation retries 50 times before timing out.',
    resources: [
      { name: 'fn-order-processor', cost: '+$380/day' },
      { name: 'fn-notification-sender', cost: '+$230/day' },
    ],
  },
  {
    id: 'alert-5',
    severity: 'warning',
    type: 'Budget Breach',
    title: 'Dev Environment Approaching Monthly Budget',
    service: 'AWS · Multiple',
    provider: 'AWS',
    timestamp: '2026-05-01 · 09:00 PM',
    costImpact: '85% of $5,000 budget',
    status: 'Active',
    rootCause:
      'The Dev environment has consumed 85% of its monthly budget with 12 days remaining. Several dev instances were left running over the weekend instead of being shut down via the scheduled stop policy.',
    resources: [
      { name: 'dev-ec2-cluster (x6)', cost: '+$180/day' },
      { name: 'dev-rds-postgres', cost: '+$45/day' },
    ],
  },
  {
    id: 'alert-6',
    severity: 'critical',
    type: 'Anomaly',
    title: 'RDS Storage Auto-Scaling — Unexpected Growth',
    service: 'AWS · RDS',
    provider: 'AWS',
    timestamp: '2026-05-01 · 04:20 PM',
    costImpact: '$1,800 / month',
    status: 'Resolved',
    rootCause:
      'RDS storage auto-scaled from 500 GB to 2 TB due to a migration script that failed to clean up temporary tables. The tables have since been dropped and storage is being reclaimed.',
    resources: [
      { name: 'rds-prod-postgres-primary', cost: '+$1,200/mo' },
      { name: 'rds-prod-postgres-replica', cost: '+$600/mo' },
    ],
  },
];

// ─── Default filter state ────────────────────────────────────────────────────
const DEFAULT_FILTERS = { search: '', type: '', severity: '', provider: '' };

// ─── Alerts Page ─────────────────────────────────────────────────────────────
export default function Alerts() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg] = useState('Acme Corporation');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // Simulate an API fetch on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlerts(MOCK_ALERTS);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Handle individual filter field change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Mark an alert as resolved
  const handleResolve = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Resolved' } : a))
    );
  };

  // Derive filtered + sorted alerts from state
  // Sorted: severity (critical first), then by timestamp newest first
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => {
        const matchSearch =
          !filters.search ||
          a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          a.service.toLowerCase().includes(filters.search.toLowerCase());

        const matchType = !filters.type || a.type === filters.type;
        const matchSeverity = !filters.severity || a.severity === filters.severity;
        const matchProvider = !filters.provider || a.provider === filters.provider;

        return matchSearch && matchType && matchSeverity && matchProvider;
      })
      .sort((a, b) => {
        // Critical before Warning
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (a.severity !== 'critical' && b.severity === 'critical') return 1;
        // Active before Resolved
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return 0;
      });
  }, [alerts, filters]);

  return (
    <div className={styles.page}>
      {/* Sidebar — shared across all pages */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        {/* Top bar */}
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>
          {/* Page heading */}
          <div className={styles.pageHeader}>
            <div>
              <h1>Alerts & Anomalies</h1>
              <p>Real-time detection of cost spikes, budget breaches, and unusual activity</p>
            </div>
          </div>

          {/* Filter bar */}
          <AlertFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          {/* Alert list — skeleton while loading, list after */}
          {loading ? (
            <AlertSkeleton count={5} />
          ) : (
            <AlertList alerts={filteredAlerts} onResolve={handleResolve} />
          )}
        </div>
      </div>
    </div>
  );
}
