import { useState, useEffect } from 'react'
import Sidebar from '../../shared/Sidebar'
import Header from '../components/Header'
import ResourceUsageBreakdown from '../components/ResourceUsageBreakdown'
import useAnalytics from '../hooks/useAnalytics'
import styles from './Dashboard.module.css'

export default function UsageAnalyticsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { usageData, loading, error, fetchResourceUsage } = useAnalytics()

  useEffect(() => {
    fetchResourceUsage()
  }, [fetchResourceUsage])

  return (
    <div className={styles.dashboard}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header />
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Resource Usage Analytics</h1>
            <p>Operational health and utilization metrics across all services</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(201,78,78,0.12)',
              border: '1px solid var(--danger)',
              borderRadius: '0.5rem',
              padding: '1rem 1.25rem',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          <div className={styles.bottomSection}>
            <div className={styles.fullRow} style={{ width: '100%' }}>
              <ResourceUsageBreakdown usage={usageData} />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h3>Why is this useful?</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', maxWidth: '800px' }}>
              Resource Usage Analytics provides a window into how your infrastructure is actually performing. 
              While the Dashboard focuses on costs, this section helps you identify technical efficiency. 
              Low utilization (e.g. &lt; 5% CPU) suggests over-provisioned resources that can be downsized to save costs, 
              while very high utilization ( &gt; 90% CPU) might indicate a performance risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
