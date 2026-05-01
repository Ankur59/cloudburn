'use client'

import styles from './RecentAlerts.module.css'

const alerts = [
  {
    type: 'critical',
    title: 'Cost spike detected',
    description: 'EC2 costs up 45% in us-east-1',
    time: '2 hours ago',
  },
  {
    type: 'warning',
    title: 'Budget threshold',
    description: 'Team Alpha at 80% of budget',
    time: '4 hours ago',
  },
  {
    type: 'info',
    title: 'Unused resources',
    description: '12 idle instances detected',
    time: '1 day ago',
  },
  {
    type: 'info',
    title: 'Unused resources',
    description: '12 idle instances detected',
    time: '1 day ago',
  },

]

export default function RecentAlerts() {
  return (
    <div className={styles.alertsCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>Recent Alerts</h3>
        <a href="#" className={styles.viewAllBtn}>
          <span>↗</span> View All
        </a>
      </div>
      <div className={styles.alertsList}>
        {alerts.map((alert, index) => (
          <div key={index} className={styles.alertItem}>
            <span className={`${styles.alertDot} ${styles[alert.type]}`} />
            <div className={styles.alertContent}>
              <span className={styles.alertTitle}>{alert.title}</span>
              <span className={styles.alertDesc}>{alert.description}</span>
              <span className={styles.alertTime}>{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
