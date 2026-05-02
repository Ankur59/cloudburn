import styles from './CostByService.module.css'

export default function CostByService({ services = [] }) {
  const maxCost = Math.max(...services.map((s) => s.cost), 0.000001)

  return (
    <div className={styles.costCard}>
      <h3 className={styles.title}>Cost by Service</h3>
      {services.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
          No service data available.
        </p>
      ) : (
        <div className={styles.serviceList}>
          {services.map((service, index) => {
            const pct = maxCost > 0 ? Math.round((service.cost / maxCost) * 100) : 0
            return (
              <div key={index} className={styles.serviceItem}>
                <div className={styles.serviceHeader}>
                  <span className={styles.serviceName}>{service.name}</span>
                  <span className={styles.serviceCost}>${service.cost.toFixed(6)}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
