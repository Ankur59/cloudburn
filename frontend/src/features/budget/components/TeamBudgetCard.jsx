import styles from './TeamBudgetCard.module.css';

/**
 * getStatus — returns 'healthy' | 'warning' | 'danger' based on % used
 */
function getStatus(pct, threshold) {
  if (pct >= 100)       return 'danger';
  if (pct >= threshold) return 'warning';
  return 'healthy';
}

const STATUS_LABEL = {
  healthy: 'Healthy',
  warning: 'Approaching Limit',
  danger:  'Over Budget',
};

/**
 * TeamBudgetCard
 *
 * Shows a single team's budget — spend, progress bar, status badge,
 * and an edit button to open the BudgetEditModal.
 *
 * Props:
 *  - team: { id, name, provider, currentSpend, budget, alertThreshold }
 *    currentSpend and budget are numbers (USD).
 *    alertThreshold is a number like 80 (= 80%).
 *  - onEdit: (team) => void — called when the Edit button is clicked
 */
export default function TeamBudgetCard({ team, onEdit }) {
  const { name, provider, currentSpend, budget, alertThreshold } = team;

  const pct    = Math.round((currentSpend / budget) * 100);
  const barPct = Math.min(pct, 100);
  const status = getStatus(pct, alertThreshold);

  // Format numbers as $ strings
  const fmt = (n) => '$' + n.toLocaleString('en-US');

  return (
    <div className={styles.card}>
      {/* Header: team name + provider badge + edit button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.teamName}>{name}</span>
          <span className={`${styles.providerBadge} ${styles[provider.toLowerCase()]}`}>
            {provider}
          </span>
        </div>

        <button
          id={`edit-budget-${team.id}`}
          className={styles.editBtn}
          onClick={() => onEdit(team)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Spend numbers */}
      <div className={styles.spendRow}>
        <span className={styles.currentSpend}>{fmt(currentSpend)}</span>
        <span className={styles.totalBudget}>/ {fmt(budget)}</span>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${styles[status]}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* Footer: % used + status badge + alert threshold */}
      <div className={styles.footer}>
        <span className={styles.pctLabel}>{pct}% used</span>

        <div className={styles.footerRight}>
          <span className={styles.alertThreshold}>Alert at {alertThreshold}%</span>
          <span className={`${styles.statusBadge} ${styles[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
