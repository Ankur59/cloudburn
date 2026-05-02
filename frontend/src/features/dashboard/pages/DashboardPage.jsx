'use client'

import { useState } from 'react'
import Sidebar from '../../shared/Sidebar'
import Header from '../components/Header'
import KPICards from '../components/KPICards'
import DailyCostTrend from '../components/DailyCostTrend'
import AIInsights from '../components/AIInsights'
import CostByService from '../components/CostByService'
import RecentAlerts from '../components/RecentAlerts'
import TopSpendingTeams from '../components/TopSpendingTeams'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentOrg, setCurrentOrg] = useState('Acme Corporation')

  const organizations = [
    'Acme Corporation',
    'TechStart Inc.',
    'Global Dynamics'
  ]

  return (
    <div className={styles.dashboard}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header 
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Dashboard</h1>
            <p>Overview of your cloud infrastructure costs</p>
          </div>
          
          <KPICards />
          
          <DailyCostTrend />
          
          <AIInsights />
          
          <div className={styles.bottomSection}>
            <div className={styles.leftColumn}>
              <CostByService />
              <TopSpendingTeams />
            </div>
            <div className={styles.rightColumn}>
              <RecentAlerts />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
