import { useState, useEffect } from 'react'
import Sidebar from '../../shared/Sidebar'
import Header from '../components/Header'
import KPICards from '../components/KPICards'
import DailyCostTrend from '../components/DailyCostTrend'
import AIInsights from '../components/AIInsights'
import CostByService from '../components/CostByService'
import RecentAlerts from '../components/RecentAlerts'
import TopSpendingTeams from '../components/TopSpendingTeams'
import MonthlyTrend from '../components/MonthlyTrend'
import RegionBreakdown from '../components/RegionBreakdown'
import useDashboard from '../hooks/useDashboard'
import { StatCardSkeleton, ChartSkeleton } from '../../shared/SkeletonLoader'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { data, loading, error, fetchDashboard } = useDashboard()

  useEffect(() => {
    fetchDashboard()
  }, [])

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
            <h1>Dashboard</h1>
            <p>Overview of your cloud infrastructure costs</p>
          </div>

          {/* Error state */}
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

          {/* KPI Cards */}
          {loading && !data ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[0,1,2,3].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <KPICards kpis={data?.kpis ?? []} />
          )}

          {/* Daily Cost Trend */}
          {loading && !data ? (
            <ChartSkeleton height="320px" />
          ) : (
            <DailyCostTrend data={data?.dailyCostTrend ?? []} />
          )}

          {/* Monthly Trend + Month Comparison */}
          {!loading && (
            <div className={styles.fullRow}>
              <MonthlyTrend
                data={data?.monthlyTrend ?? []}
                monthComparison={data?.monthComparison ?? {}}
              />
            </div>
          )}

          <AIInsights />

          <div className={styles.bottomSection}>
            <div className={styles.leftColumn}>
              <CostByService services={data?.services ?? []} />
              <TopSpendingTeams teams={data?.teams ?? []} />
            </div>
            <div className={styles.rightColumn}>
              <RegionBreakdown
                regions={data?.regionBreakdown ?? []}
                topOperations={data?.topOperations ?? []}
              />
              <RecentAlerts recentAlerts={data?.recentAlerts ?? []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
