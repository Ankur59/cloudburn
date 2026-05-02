import styles from './ZombieSkeleton.module.css';

/**
 * ZombieSkeleton
 *
 * Skeleton shimmer rows shown while the scan is running.
 * Props:
 *  - count: number of rows (default 6)
 */
export default function ZombieSkeleton({ count = 6 }) {
  // Column widths matching the real table columns
  const cols = ['40px', '120px', '160px', '90px', '80px', '70px', '80px', '100px'];

  return (
    <div className={styles.wrapper}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.row}>
          {cols.map((w, j) => (
            <div key={j} className={styles.line} style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}
