import { useState } from 'react';
import styles from './AlertCard.module.css';

/**
 * AlertCard
 *
 * Renders a single alert row. Clicking it expands an inline drawer
 * showing root cause, affected resources, cost breakdown, and action buttons.
 *
 * Props:
 *  - alert: alert data object (see MOCK_ALERTS in Alerts.jsx for shape)
 *  - onResolve: (alertId) => void — called when user marks alert as resolved
 */
export default function AlertCard({ alert, onResolve }) {
  const [expanded, setExpanded] = useState(false);

  // Toggle expand/collapse on card click
  const handleToggle = () => setExpanded((prev) => !prev);

  const isCritical = alert.severity === 'critical';

  return (
    <div
      className={`${styles.card} ${expanded ? styles.expanded : ''}`}
      id={`alert-card-${alert.id}`}
    >
      {/* Colored left border by severity */}
      <div className={`${styles.severityBar} ${isCritical ? styles.critical : styles.warning}`} />

      <div style={{ flex: 1 }}>
        {/* ── Main row (always visible) ── */}
        <div className={styles.body} onClick={handleToggle} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        >
          {/* Left: badge + title + meta */}
          <div className={styles.left}>
            <span className={`${styles.badge} ${isCritical ? styles.critical : styles.warning}`}>
              {isCritical ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
              {isCritical ? 'Critical' : 'Warning'}
            </span>

            <div className={styles.meta}>
              <p className={styles.title}>{alert.title}</p>
              <div className={styles.subMeta}>
                <span className={styles.service}>{alert.service}</span>
                <span className={styles.type}>{alert.type}</span>
                <span className={styles.timestamp}>{alert.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Right: cost impact + status + chevron */}
          <div className={styles.right}>
            <span className={`${styles.cost} ${!isCritical ? styles.warning : ''}`}>
              +{alert.costImpact}
            </span>

            <span className={`${styles.statusBadge} ${alert.status === 'Active' ? styles.active : styles.resolved}`}>
              <span className={`${styles.statusDot} ${alert.status === 'Active' ? styles.active : styles.resolved}`} />
              {alert.status}
            </span>

            <span className={`${styles.chevron} ${expanded ? styles.open : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>

        {/* ── Expanded Drawer ── */}
        {expanded && (
          <div className={styles.drawer}>
            <div className={styles.drawerGrid}>
              {/* Root cause */}
              <div className={styles.drawerSection}>
                <h4>Root Cause</h4>
                <p>{alert.rootCause}</p>
              </div>

              {/* Affected Resources */}
              <div className={styles.drawerSection}>
                <h4>Affected Resources</h4>
                <div className={styles.resourceList}>
                  {alert.resources.map((r) => (
                    <div key={r.name} className={styles.resourceItem}>
                      <span className={styles.resourceName}>{r.name}</span>
                      <span className={styles.resourceCost}>{r.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.drawerActions}>
                <button
                  id={`alert-review-${alert.id}`}
                  className={styles.actionBtn}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Review Resource
                </button>

                <button
                  id={`alert-budget-${alert.id}`}
                  className={styles.actionBtn}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M7 15h0M2 9.5h20"/>
                  </svg>
                  Set Budget Alert
                </button>

                {alert.status === 'Active' && (
                  <button
                    id={`alert-resolve-${alert.id}`}
                    className={`${styles.actionBtn} ${styles.resolveBtn}`}
                    onClick={() => onResolve(alert.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
