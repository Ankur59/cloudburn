import styles from './GlobalBudgetCard.module.css';

/**
 * getStatus — determines colour theme based on how much of the budget is used
 * Returns 'healthy' | 'warning' | 'danger'
 */
function getStatus(pct) {
  if (pct >= 100) return 'danger';
  if (pct >= 80)  return 'warning';
  return 'healthy';
}

const STATUS_LABEL = {
  healthy: 'On Track',
  warning: 'Approaching Limit',
  danger:  'Over Budget',
};

/**
 * GlobalBudgetCard
 *
 * Full-width card at the top of the Budget page showing the
 * organisation's total spend vs budget with a large progress bar.
 *
 * Props:
 *  - budget: { totalBudget, currentSpend, projectedSpend, lastMonth }
 *    All monetary values are numbers (in USD).
 */
export default function GlobalBudgetCard({ budget }) {
  const { totalBudget, currentSpend, projectedSpend, lastMonth } = budget;

  // Percentage of budget used (capped at 100 for the bar, but we show real % in text)
  const pct     = Math.round((currentSpend / totalBudget) * 100);
  const barPct  = Math.min(pct, 100);
  const status  = getStatus(pct);

  // How much budget is left
  const remaining = totalBudget - currentSpend;

  // Month-over-month change
  const momDiff = Math.round(((currentSpend - lastMonth) / lastMonth) * 100);

  // Helper to format numbers as $ strings
  const fmt = (n) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        {/* Title */}
        <div className={styles.titleGroup}>
          <h2>Organisation Budget</h2>
          <p>Current month · All teams · All providers</p>
        </div>

        {/* Status badge */}
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          <span className={`${styles.statusDot} ${styles[status]}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Spend numbers */}
      <div className={styles.spendRow}>
        <span className={styles.currentSpend}>{fmt(currentSpend)}</span>
        <span className={styles.totalBudget}>/ {fmt(totalBudget)}</span>
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles[status]}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className={styles.progressMeta}>
          <span className={styles.progressPct}>{pct}% used</span>
          <span className={styles.progressRemaining}>
            {remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over budget`}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Projected Month-End</span>
          <span className={`${styles.statValue} ${projectedSpend > totalBudget ? styles.up : ''}`}>
            {fmt(projectedSpend)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Last Month</span>
          <span className={styles.statValue}>{fmt(lastMonth)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>vs Last Month</span>
          <span className={`${styles.statValue} ${momDiff > 0 ? styles.up : styles.down}`}>
            {momDiff > 0 ? '+' : ''}{momDiff}%
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Budget</span>
          <span className={styles.statValue}>{fmt(totalBudget)}</span>
        </div>
      </div>
    </div>
  );
}
