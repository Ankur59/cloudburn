import styles from './SyncHistory.module.css';

/**
 * SyncHistory
 * Shows the last 10 sync log entries across all accounts.
 *
 * Props:
 *  - entries: array of sync log objects
 *  - onRetry: (entryId) => void
 */
export default function SyncHistory({ entries, onRetry }) {
  return (
    <div className={styles.wrapper}>
      {entries.map((entry) => (
        <div key={entry.id} className={styles.entry}>
          {/* Provider colour dot */}
          <span className={`${styles.providerDot} ${styles[entry.provider.toLowerCase()]}`} />

          {/* Main info */}
          <div className={styles.entryMain}>
            <span className={styles.entryAccount}>{entry.accountName}</span>
            <span className={`${styles.entryStatus} ${styles[entry.result]}`}>
              {entry.result === 'success' ? '✓ Synced successfully' : '✕ Sync failed'}
            </span>
          </div>

          {/* Timestamp */}
          <span className={styles.entryTime}>{entry.timestamp}</span>

          {/* Retry button on failure */}
          {entry.result === 'failed' && (
            <button
              id={`retry-sync-${entry.id}`}
              className={styles.retryBtn}
              onClick={() => onRetry(entry.id)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
