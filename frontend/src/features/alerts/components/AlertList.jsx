import AlertCard from './AlertCard';
import AlertEmptyState from './AlertEmptyState';
import styles from './AlertList.module.css';

/**
 * AlertList
 *
 * Renders the full list of (filtered) alert cards,
 * or the empty state when there's nothing to show.
 *
 * Props:
 *  - alerts: array of alert objects to display
 *  - onResolve: (alertId) => void — passed down to each AlertCard
 */
export default function AlertList({ alerts, onResolve }) {
  if (alerts.length === 0) {
    return <AlertEmptyState />;
  }

  return (
    <div className={styles.list}>
      {/* Small count label */}
      <div className={styles.listHeader}>
        <p className={styles.listCount}>
          Showing <span>{alerts.length}</span> alert{alerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Render each alert card */}
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onResolve={onResolve} />
      ))}
    </div>
  );
}
