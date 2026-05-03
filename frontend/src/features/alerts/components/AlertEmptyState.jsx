import styles from './AlertEmptyState.module.css';

/**
 * AlertEmptyState
 *
 * Displayed when no alerts match the current filters,
 * or when there are no active alerts at all.
 */
export default function AlertEmptyState() {
  return (
    <div className={styles.empty}>
      {/* Green checkmark icon */}
      <div className={styles.iconWrapper}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <p className={styles.title}>No active alerts</p>
      <p className={styles.subtitle}>
        Your cloud spend looks healthy. We'll notify you as soon as an anomaly or budget breach is detected.
      </p>
    </div>
  );
}
