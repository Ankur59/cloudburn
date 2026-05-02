import styles from './ZombieSummaryCards.module.css';

/**
 * ZombieSummaryCards
 *
 * Three stat cards: Total Wasted Spend · Zombie Count · Potential Savings.
 *
 * Props:
 *  - totalWasted: string  e.g. "$18,240"
 *  - zombieCount: number
 *  - potentialSavings: string  e.g. "$18,240"
 */
export default function ZombieSummaryCards({ totalWasted, zombieCount, potentialSavings }) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.label}>Total Wasted Spend</span>
        <span className={`${styles.value} ${styles.danger}`}>{totalWasted}</span>
        <span className={styles.sub}>across all idle resources · this month</span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Zombie Resources</span>
        <span className={`${styles.value} ${styles.warning}`}>{zombieCount}</span>
        <span className={styles.sub}>idle / unused resources detected</span>
      </div>

      <div className={styles.card}>
        <span className={styles.label}>Potential Monthly Savings</span>
        <span className={`${styles.value} ${styles.success}`}>{potentialSavings}</span>
        <span className={styles.sub}>if all zombies are cleaned up</span>
      </div>
    </div>
  );
}
