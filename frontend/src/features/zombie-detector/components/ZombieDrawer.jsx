import styles from './ZombieDrawer.module.css';

/**
 * ZombieDrawer
 *
 * Right-side slide-in panel for a selected resource.
 * Shows: metadata · flat-line usage graph · Claude AI summary · action buttons.
 *
 * Props:
 *  - resource: the zombie resource object
 *  - onClose: () => void
 *  - onTerminate: (id) => void
 *  - onSnooze: (id) => void
 *  - onIgnore: (id) => void
 */
export default function ZombieDrawer({ resource, onClose, onTerminate, onSnooze, onIgnore }) {
  if (!resource) return null;

  // Close when clicking the dark backdrop (outside the drawer)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.drawer} id="zombie-detail-drawer">

        {/* ── Header ── */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{resource.resourceType} · {resource.resourceId}</span>
          <button id="close-zombie-drawer" className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.drawerBody}>

          {/* Resource Metadata */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Resource Metadata</p>
            <div className={styles.metaGrid}>
              <span className={styles.metaKey}>Resource ID</span>
              <span className={styles.metaValue}>{resource.resourceId}</span>

              <span className={styles.metaKey}>Type</span>
              <span className={styles.metaValue}>{resource.resourceType}</span>

              <span className={styles.metaKey}>Cloud</span>
              <span className={styles.metaValue}>{resource.cloud}</span>

              <span className={styles.metaKey}>Region</span>
              <span className={styles.metaValue}>{resource.region}</span>

              <span className={styles.metaKey}>Created</span>
              <span className={styles.metaValue}>{resource.createdDate}</span>

              <span className={styles.metaKey}>Idle Since</span>
              <span className={styles.metaValue}>{resource.idleSince}</span>

              <span className={styles.metaKey}>Cost / Month</span>
              <span className={styles.metaValue}>{resource.costPerMonth}</span>
            </div>
          </div>

          {/* Usage Graph — flat line proves it's a zombie */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Usage Activity</p>
            <div className={styles.graphBox}>
              <span className={styles.graphLabel}>CPU / Network utilisation (last 30d)</span>
              <div className={styles.flatLine} />
            </div>
          </div>

          {/* Claude AI Summary */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>AI Analysis</p>
            <div className={styles.aiBox}>
              <div className={styles.aiLabel}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round"/>
                </svg>
                Claude AI Summary
              </div>
              <p className={styles.aiText}>{resource.aiSummary}</p>
            </div>
          </div>

        </div>

        {/* ── Action Buttons ── */}
        <div className={styles.drawerActions}>
          <button
            id={`terminate-${resource.id}`}
            className={`${styles.actBtn} ${styles.terminate}`}
            onClick={() => { onTerminate(resource.id); onClose(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
            Terminate Resource
          </button>

          <button
            id={`snooze-${resource.id}`}
            className={styles.actBtn}
            onClick={() => { onSnooze(resource.id); onClose(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Snooze 7 Days
          </button>

          <button
            id={`ignore-${resource.id}`}
            className={styles.actBtn}
            onClick={() => { onIgnore(resource.id); onClose(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            Ignore
          </button>
        </div>

      </div>
    </div>
  );
}
