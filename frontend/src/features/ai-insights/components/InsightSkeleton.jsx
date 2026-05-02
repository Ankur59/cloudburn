import styles from './InsightSkeleton.module.css';

/**
 * InsightSkeleton
 *
 * Shows shimmer skeleton cards while the AI scan is in progress.
 *
 * Props:
 *  - count: number of skeleton cards to show (default 4)
 */
export default function InsightSkeleton({ count = 4 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.line} style={{ width: '60%' }} />
          <div className={styles.line} style={{ width: '35%' }} />
          <div className={styles.line} style={{ width: '80%', marginTop: 4 }} />
          <div className={styles.line} style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  );
}
