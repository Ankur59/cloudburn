import styles from "./SkeletonLoader.module.css";

/* ─── Primitive bone ──────────────────────────────────── */
export const Bone = ({ width = "100%", height = "1rem", rounded = false, className = "" }) => (
  <span
    className={`${styles.bone} ${rounded ? styles.rounded : ""} ${className}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

/* ─── Card skeleton ───────────────────────────────────── */
export const CardSkeleton = ({ lines = 3 }) => (
  <div className={styles.card}>
    <Bone height="1.1rem" width="55%" />
    <div className={styles.gap} />
    {Array.from({ length: lines }).map((_, i) => (
      <Bone key={i} height="0.8rem" width={i === lines - 1 ? "70%" : "100%"} />
    ))}
  </div>
);

/* ─── Table / row skeleton ────────────────────────────── */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className={styles.table}>
    {/* header */}
    <div className={styles.tableRow}>
      {Array.from({ length: cols }).map((_, i) => (
        <Bone key={i} height="0.75rem" width="80%" />
      ))}
    </div>
    {/* body rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className={`${styles.tableRow} ${styles.bodyRow}`}>
        {Array.from({ length: cols }).map((_, c) => (
          <Bone key={c} height="0.8rem" width={c === 0 ? "60%" : "40%"} />
        ))}
      </div>
    ))}
  </div>
);

/* ─── Dashboard stat-card skeleton ───────────────────── */
export const StatCardSkeleton = () => (
  <div className={styles.statCard}>
    <div className={styles.statTop}>
      <Bone height="0.75rem" width="50%" />
      <Bone height="1.5rem" width="1.5rem" rounded />
    </div>
    <Bone height="2rem" width="65%" />
    <Bone height="0.7rem" width="45%" />
  </div>
);

/* ─── Chart / block skeleton ─────────────────────────── */
export const ChartSkeleton = ({ height = "200px" }) => (
  <div className={styles.chart} style={{ height }}>
    <div className={styles.chartInner} />
  </div>
);

/* ─── Default export – picks the right variant ─────────── */
/**
 * <SkeletonLoader variant="card|table|stat|chart|bone" ...props />
 */
const SkeletonLoader = ({ variant = "card", ...props }) => {
  switch (variant) {
    case "table": return <TableSkeleton {...props} />;
    case "stat":  return <StatCardSkeleton {...props} />;
    case "chart": return <ChartSkeleton {...props} />;
    case "bone":  return <Bone {...props} />;
    default:      return <CardSkeleton {...props} />;
  }
};

export default SkeletonLoader;
