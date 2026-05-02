import styles from './AlertSkeleton.module.css';

/**
 * AlertSkeleton
 *
 * Displays animated skeleton rows while alerts are loading.
 * Props:
 *  - count: number of skeleton rows to show (default: 5)
 */
export default function AlertSkeleton({ count = 5 }) {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          {/* Colored left bar */}
          <div
            className={styles.skeletonBar}
            style={{ background: i % 2 === 0 ? 'var(--danger)' : 'var(--warning)', opacity: 0.3 }}
          />

          {/* Body lines */}
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '30%' }} />
          </div>

          {/* Right side */}
          <div className={styles.skeletonRight}>
            <div className={styles.skeletonLine} style={{ width: '64px' }} />
            <div className={styles.skeletonLine} style={{ width: '56px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
