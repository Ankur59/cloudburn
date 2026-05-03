import styles from './AddAccountCard.module.css';

/**
 * AddAccountCard
 * Dashed "Connect a new cloud account" card.
 * Props:
 *  - onClick: () => void
 */
export default function AddAccountCard({ onClick }) {
  return (
    <div id="add-account-card" className={styles.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>

      <div className={styles.plusIcon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>

      <div className={styles.providerIcons}>
        <span className={`${styles.iconPill} ${styles.aws}`}>AWS</span>
        <span className={`${styles.iconPill} ${styles.gcp}`}>GCP</span>
        <span className={`${styles.iconPill} ${styles.azure}`}>Azure</span>
      </div>

      <p className={styles.title}>Connect a new cloud account</p>
      <p className={styles.sub}>AWS, GCP, or Azure · takes under 2 minutes</p>
    </div>
  );
}
