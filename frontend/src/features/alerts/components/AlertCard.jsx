import { useState } from 'react';
import styles from './AlertCard.module.css';

/**
 * AlertCard
 *
 * Renders a single alert row. Clicking it expands an inline drawer
 * showing root cause, affected resources, cost breakdown, and action buttons.
 */
export default function AlertCard({ alert, onResolve }) {
  const [expanded, setExpanded] = useState(false);

  // Toggle expand/collapse on card click
  const handleToggle = () => setExpanded((prev) => !prev);

  const isCritical = alert.severity === 'critical';
  const isZombie = alert.type === 'Zombie';
  const isBudget = alert.type === 'Budget';

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
            <div className={styles.iconContainer}>
              {isZombie ? (
                <div className={`${styles.typeIcon} ${styles.zombie}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              ) : isBudget ? (
                <div className={`${styles.typeIcon}`} style={{ color: 'var(--success)', backgroundColor: 'rgba(77, 184, 122, 0.1)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </div>
              ) : (
                <div className={`${styles.typeIcon} ${styles.spike}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
              )}
            </div>

            <div className={styles.meta}>
              <div className={styles.titleRow}>
                <p className={styles.title}>{alert.title}</p>
                <span className={`${styles.typeBadge} ${isZombie ? styles.zombie : isBudget ? '' : styles.spike}`}
                      style={isBudget ? { backgroundColor: 'rgba(77, 184, 122, 0.15)', color: 'var(--success)' } : {}}>
                  {alert.type}
                </span>
              </div>
              <div className={styles.subMeta}>
                <span className={styles.service}>{alert.service}</span>
                <span className={styles.timestamp}>{alert.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Right: cost impact/usage + status + chevron */}
          <div className={styles.right}>
            <div className={styles.impactContainer}>
              <span className={`${styles.cost} ${!isCritical ? styles.warning : ''}`}>
                {isZombie ? alert.resources[0].cost : isBudget ? alert.costImpact : `+${alert.costImpact}`}
              </span>
              <span className={styles.impactLabel}>{isZombie ? 'Avg Usage' : isBudget ? 'Limit' : 'Impact'}</span>
            </div>

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
              {/* Root cause / AI Explanation */}
              <div className={styles.drawerSection}>
                <h4>AI Analysis</h4>
                <p className={styles.explanation}>{alert.rootCause}</p>
              </div>

              {/* Details */}
              <div className={styles.drawerSection}>
                <h4>{isZombie ? 'Resource Details' : 'Cost Breakdown'}</h4>
                <div className={styles.resourceList}>
                  {alert.resources.map((r, idx) => (
                    <div key={idx} className={styles.resourceItem}>
                      <span className={styles.resourceName}>{r.name}</span>
                      <span className={styles.resourceCost}>{r.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.drawerActions}>
                {isZombie ? (
                  <button className={`${styles.actionBtn} ${styles.dangerBtn}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Terminate Resource
                  </button>
                ) : (
                  <button className={styles.actionBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M7 15h0M2 9.5h20" />
                    </svg>
                    Set Budget Limit
                  </button>
                )}

                <button className={styles.actionBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View in Dashboard
                </button>

                {alert.status === 'Active' && (
                  <button
                    className={`${styles.actionBtn} ${styles.resolveBtn}`}
                    onClick={() => onResolve(alert.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Dismiss Alert
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
