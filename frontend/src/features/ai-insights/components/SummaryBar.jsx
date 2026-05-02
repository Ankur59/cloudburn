import styles from './SummaryBar.module.css';

/**
 * SummaryBar
 *
 * The full-width bar at the top showing:
 * — Total potential savings this month
 * — Number of active suggestions
 * — Last AI scan timestamp
 *
 * Props:
 *  - totalSavings: string  e.g. "$12,840"
 *  - suggestionCount: number
 *  - lastScan: string  e.g. "2 minutes ago"
 */
export default function SummaryBar({ totalSavings, suggestionCount, lastScan }) {
  return (
    <div className={styles.bar}>
      {/* Potential Savings */}
      <div className={styles.stat}>
        <span className={styles.statLabel}>Potential Monthly Savings</span>
        <span className={`${styles.statValue} ${styles.savings}`}>{totalSavings}</span>
        <span className={styles.statSub}>if all suggestions are applied</span>
      </div>

      {/* Active Suggestions */}
      <div className={styles.stat}>
        <span className={styles.statLabel}>Active Suggestions</span>
        <span className={styles.statValue}>{suggestionCount}</span>
        <span className={styles.statSub}>across all categories</span>
      </div>

      {/* Last Scan */}
      <div className={styles.stat}>
        <span className={styles.statLabel}>Last AI Scan</span>
        <span className={styles.statValue} style={{ fontSize: '15px' }}>{lastScan}</span>
        <span className={styles.statSub}>powered by Claude AI</span>
      </div>
    </div>
  );
}
