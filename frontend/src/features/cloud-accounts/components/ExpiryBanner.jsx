import styles from './ExpiryBanner.module.css';

/**
 * ExpiryBanner
 * Amber warning banner shown when any credential is expiring.
 * Props:
 *  - message: string  e.g. "Azure credentials expiring in 3 days"
 *  - onUpdate: () => void  — opens the edit drawer for that account
 *  - onDismiss: () => void
 */
export default function ExpiryBanner({ message, onUpdate, onDismiss }) {
  return (
    <div id="expiry-banner" className={styles.banner}>
      <span className={styles.icon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>

      <span className={styles.text}>⚠️ {message}</span>

      <button id="expiry-update-btn" className={styles.updateBtn} onClick={onUpdate}>
        Update Now
      </button>

      <button id="expiry-dismiss-btn" className={styles.dismissBtn} onClick={onDismiss} title="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
