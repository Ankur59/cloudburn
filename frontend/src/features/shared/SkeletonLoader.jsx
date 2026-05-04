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

/* ─── Chart / block skeleton ─────────── */
export const ChartSkeleton = ({ height = "200px" }) => (
  <div className={styles.chart} style={{ height }}>
    <div className={styles.chartInner} />
  </div>
);

/* ─── Dashboard skeleton (Full Page) ─────── */
export const DashboardSkeleton = () => (
  <div className={styles.fullLayout}>
    {/* Sidebar Skeleton */}
    <div className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <Bone height="2rem" width="2rem" rounded />
        <Bone height="1.5rem" width="120px" />
      </div>
      <div className={styles.sidebarMenu}>
        <Bone height="0.9rem" width="80px" />
        <div className={styles.gap} style={{ height: "0.25rem" }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.sidebarItem}>
            <Bone height="1.25rem" width="1.25rem" rounded />
            <Bone height="1rem" width="120px" />
          </div>
        ))}
      </div>
    </div>

    {/* Main Area Skeleton */}
    <div className={styles.mainArea}>
      {/* Topbar Skeleton */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Bone height="1.25rem" width="1.25rem" rounded />
          <Bone height="1.25rem" width="150px" />
          <Bone height="1.5rem" width="60px" rounded />
        </div>
        <div className={styles.topbarRight}>
          <Bone height="1.5rem" width="1.5rem" rounded />
          <Bone height="2rem" width="2rem" rounded />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className={styles.contentArea}>
        <div className={styles.dashboardHeader}>
          <Bone height="2rem" width="180px" />
          <Bone height="1rem" width="280px" />
        </div>
        <div className={styles.statGrid}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <ChartSkeleton height="300px" />
        <ChartSkeleton height="180px" />
      </div>
    </div>
  </div>
);

/* ─── Default export – picks the right variant ─────────── */
/**
 * <SkeletonLoader variant="dashboard|card|table|stat|chart|bone" ...props />
 */
const SkeletonLoader = ({ variant = "dashboard", ...props }) => {
  switch (variant) {
    case "table": return <TableSkeleton {...props} />;
    case "stat":  return <StatCardSkeleton {...props} />;
    case "chart": return <ChartSkeleton {...props} />;
    case "bone":  return <Bone {...props} />;
    case "card":  return <CardSkeleton {...props} />;
    case "dashboard":
    default:      return <DashboardSkeleton {...props} />;
  }
};

export default SkeletonLoader;
