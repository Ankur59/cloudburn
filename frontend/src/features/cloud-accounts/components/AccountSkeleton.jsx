import styles from './AccountSkeleton.module.css';

/**
 * AccountSkeleton — shimmer placeholder cards shown while loading.
 * Props:
 *  - count: number of skeleton cards (default 4)
 */
export default function AccountSkeleton({ count = 4 }) {
  const lines = ['70%', '50%', '40%', '60%', '80%'];
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          {lines.map((w, j) => (
            <div key={j} className={styles.line} style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}
