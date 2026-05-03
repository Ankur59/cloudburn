import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAlerts, setLoading, resolveAlert } from '../alerts.slice';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import AlertFilterBar from '../components/AlertFilterBar';
import AlertList from '../components/AlertList';
import AlertSkeleton from '../components/AlertSkeleton';
import styles from './Alerts.module.css';

import { getAlertsApi, resolveAlertApi } from '../alerts.api';

// ─── Normalization ────────────────────────────────────────────────────────────
// Maps backend SpikeAlert documents to the UI format used in this component.
const normalizeAlert = (alert) => {
  const isSpike = alert.alertType === 'SPIKE';
  const isZombie = alert.alertType === 'ZOMBIE';
  
  if (isZombie) {
    return {
      id: alert._id || alert.id,
      severity: alert.idleDays > 30 ? 'critical' : 'warning',
      type: 'Zombie',
      title: `Idle ${alert.service} Resource Detected`,
      service: `AWS · ${alert.service}`,
      provider: 'AWS',
      timestamp: new Date(alert.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(',', ' ·'),
      costImpact: alert.message || 'Potential waste detected',
      status: alert.isRead ? 'Resolved' : 'Active',
      rootCause: alert.aiExplanation || 'Analyzing idle patterns...',
      resources: [
        { name: `Resource: ${alert.resourceId}`, cost: `Usage: ${alert.currentValue}%` },
      ],
    };
  }

  // SPIKE normalization
  const impact = (alert.currentCost || 0) - (alert.previousCost || 0);
  return {
    id: alert._id || alert.id,
    severity: (alert.multiplier || 0) >= 2 ? 'critical' : 'warning',
    type: 'Spike',
    title: `${alert.service} Cost Spike Detected`,
    service: `AWS · ${alert.service}`,
    provider: 'AWS',
    timestamp: new Date(alert.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', ' ·'),
    costImpact: `$${impact.toFixed(2)} increase`,
    status: alert.isRead ? 'Resolved' : 'Active',
    rootCause: alert.aiExplanation || 'Analyzing spike patterns...',
    resources: [
      { name: `${alert.service} (Current)`, cost: `$${(alert.currentCost || 0).toFixed(2)}` },
      { name: `${alert.service} (Previous)`, cost: `$${(alert.previousCost || 0).toFixed(2)}` },
    ],
  };
};

// ─── Default filter state ────────────────────────────────────────────────────
const DEFAULT_FILTERS = { search: '', type: '', severity: '', provider: '' };

// ─── Alerts Page ─────────────────────────────────────────────────────────────
export default function Alerts() {
  const dispatch = useDispatch();
  const { alerts, loading } = useSelector((state) => state.alerts);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Fetch real alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        console.log('🔍 Fetching alerts...');
        dispatch(setLoading(true));
        const response = await getAlertsApi();
        
        // Correct data path: response.data is the body, response.data.data is the payload
        const rawAlerts = response.data?.data?.alerts || response.data?.alerts || [];
        console.log(`✅ Fetched ${rawAlerts.length} alerts`);
        
        const normalized = rawAlerts.map(alert => {
          try {
            return normalizeAlert(alert);
          } catch (e) {
            console.error('Failed to normalize alert:', alert, e);
            return null;
          }
        }).filter(Boolean);

        dispatch(setAlerts(normalized));
      } catch (err) {
        console.error('❌ Failed to fetch alerts:', err);
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    };
    
    fetchAlerts();
  }, [dispatch]);

  // Handle individual filter field change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Mark an alert as resolved via API
  const handleResolve = async (alertId) => {
    try {
      await resolveAlertApi(alertId);
      dispatch(resolveAlert(alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
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
        <Header />

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
