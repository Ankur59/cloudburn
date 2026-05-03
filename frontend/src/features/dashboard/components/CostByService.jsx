import styles from './CostByService.module.css'

export default function CostByService({ services = [] }) {
  const maxCost = Math.max(...services.map((s) => s.cost), 0.000001)

  return (
    <div className={styles.costCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>Cost by Service</h3>
        <span className={styles.badge}>{services.length} services</span>
      </div>
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
                  <div className={styles.serviceLeft}>
                    <span className={styles.serviceRank}>#{index + 1}</span>
                    <span className={styles.serviceName}>{service.name}</span>
                  </div>
                  <div className={styles.serviceRight}>
                    <span className={styles.serviceCost}>${service.cost.toFixed(2)}</span>
                    {service.percentOfTotal > 0 && (
                      <span className={styles.servicePct}>{service.percentOfTotal}%</span>
                    )}
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${pct}%`, opacity: 1 - index * 0.07 }}
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
