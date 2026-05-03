import styles from './RecentAlerts.module.css'

export default function RecentAlerts({ recentAlerts = [] }) {
  return (
    <div className={styles.alertsCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>Recent Alerts</h3>
        <a href="#" className={styles.viewAllBtn}>
          <span>↗</span> View All
        </a>
      </div>
      {recentAlerts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
          No active alerts.
        </p>
      ) : (
        <div className={styles.alertsList}>
          {recentAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertItem}>
              <span className={`${styles.alertDot} ${styles[alert.severity]}`} />
              <div className={styles.alertContent}>
                <span className={styles.alertTitle}>{alert.title}</span>
                <span className={styles.alertDesc}>{alert.message}</span>
                <span className={styles.alertTime}>{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
