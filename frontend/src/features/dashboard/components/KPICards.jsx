'use client'

import styles from './KPICards.module.css'

export default function KPICards() {
  const kpis = [
    {
      label: 'Total Spend (MTD)',
      value: '$124,589',
      trend: '+12.5%',
      trendDirection: 'up',
      subtitle: 'from last month',
      icon: 'dollar',
      budgetUsed: 62,
    },
    {
      label: 'Savings This Month',
      value: '$8,420',
      subtitle: 'Reserved instance savings',
      icon: 'savings',
      valueColor: 'success',
    },
    {
      label: 'Projected Month-End Cost',
      value: '$156,420',
      trend: '+8.2%',
      trendDirection: 'up',
      subtitle: 'vs last month projection',
      icon: 'projection',
    },
    {
      label: 'Active Alerts',
      value: '7',
      subtitle: '3 critical',
      subtitleHighlight: '4 warnings',
      icon: 'alert',
      valueColor: 'danger',
    },
  ]

  return (
    <div className={styles.kpiGrid}>
      {kpis.map((kpi, index) => (
        <div key={index} className={styles.kpiCard}>
          <div className={styles.cardHeader}>
            <span className={styles.label}>{kpi.label}</span>
            <KPIIcon type={kpi.icon} />
          </div>
          <div className={`${styles.value} ${kpi.valueColor ? styles[kpi.valueColor] : ''}`}>
            {kpi.value}
          </div>
          {kpi.trend && (
            <div className={`${styles.trend} ${styles[kpi.trendDirection]}`}>
              <TrendIcon direction={kpi.trendDirection} />
              <span>{kpi.trend}</span>
              <span className={styles.trendSubtitle}>{kpi.subtitle}</span>
            </div>
          )}
          {!kpi.trend && kpi.subtitle && (
            <div className={styles.subtitle}>
              {kpi.subtitleHighlight ? (
                <>
                  <span className={styles.critical}>{kpi.subtitle}</span>
                  <span className={styles.dot}>·</span>
                  <span className={styles.warning}>{kpi.subtitleHighlight}</span>
                </>
              ) : (
                kpi.subtitle
              )}
            </div>
          )}
          {kpi.budgetUsed !== undefined && (
            <div className={styles.budgetProgress}>
              <div className={styles.budgetHeader}>
                <span>Budget Used</span>
                <span className={styles.budgetPercent}>{kpi.budgetUsed}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${kpi.budgetUsed}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function KPIIcon({ type }) {
  const icons = {
    dollar: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    savings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    projection: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    resources: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    alert: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  }
  return <span className={styles.icon}>{icons[type]}</span>
}

function TrendIcon({ direction }) {
  if (direction === 'up') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}
