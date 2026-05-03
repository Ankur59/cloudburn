import styles from './RegionBreakdown.module.css'

export default function RegionBreakdown({ regions = [], topOperations = [] }) {
  const maxCost = Math.max(...regions.map((r) => r.cost), 0.000001)

  return (
    <div className={styles.card}>
      {/* Region breakdown */}
      <div className={styles.section}>
        <h3 className={styles.title}>Cost by Region</h3>
        {regions.length === 0 ? (
          <p className={styles.empty}>No region data available.</p>
        ) : (
          <div className={styles.list}>
            {regions.map((r, i) => {
              const pct = Math.round((r.cost / maxCost) * 100)
              return (
                <div key={i} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <div className={styles.regionName}>
                      <span className={styles.regionFlag}>🌐</span>
                      {r.region}
                    </div>
                    <span className={styles.itemCost}>${r.cost.toFixed(2)}</span>
                  </div>
                  <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top operations */}
      {topOperations.length > 0 && (
        <div className={styles.section} style={{ marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
          <h3 className={styles.title}>Top Operations</h3>
          <div className={styles.opList}>
            {topOperations.map((op, i) => (
              <div key={i} className={styles.opItem}>
                <div className={styles.opLeft}>
                  <span className={styles.opService}>{op.service}</span>
                  <span className={styles.opName}>{op.operation}</span>
                </div>
                <span className={styles.opCost}>${op.cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
