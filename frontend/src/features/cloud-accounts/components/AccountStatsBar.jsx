import styles from './AccountStatsBar.module.css';

/**
 * AccountStatsBar
 * Three top stat cards: Total Connected · Total MTD Spend · Needs Attention.
 *
 * Props:
 *  - totalAccounts: number
 *  - totalSpend: string  e.g. "$48,200"
 *  - needsAttention: number
 */
export default function AccountStatsBar({ totalAccounts, totalSpend, needsAttention }) {
  return (
    <div className={styles.bar}>
      <div className={styles.card}>
        <span className={styles.label}>Connected Accounts</span>
        <span className={styles.value}>{totalAccounts}</span>
        <span className={styles.sub}>across AWS, GCP, Azure</span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Total MTD Spend</span>
        <span className={styles.value}>{totalSpend}</span>
        <span className={styles.sub}>month-to-date across all accounts</span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Needs Attention</span>
        <span className={`${styles.value} ${needsAttention > 0 ? styles.warning : ''}`}>
          {needsAttention}
        </span>
        <span className={styles.sub}>
          {needsAttention > 0 ? 'expiring credentials or sync errors' : 'all accounts healthy'}
        </span>
      </div>
    </div>
  );
}
