'use client'

import styles from './Sidebar.module.css'
import {Link} from "react-router-dom"


const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'alerts',    label: 'Alerts',         href: '/alerts' },
  { icon: 'ai-insights',    label: 'AI Insights',    href: '/ai-insights' },
  { icon: 'zombie-detector',    label: 'Zombie Detector',    href: '/zombie-detector' },
  { icon: 'cloud',     label: 'Cloud Accounts',  href: '/cloud-accounts' },
  { icon: 'teams',     label: 'Teams',           href: '/teams' },
  { icon: 'budget',    label: 'Budget',          href: '/budget' },
  { icon: 'reports',   label: 'Reports',         href: '/reports' },
  { icon: 'admin',     label: 'Admin',           href: '#' },
]

function NavIcon({ type }) {
  const icons = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    
    "ai-insights": (
     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round"/>
</svg>
    ),  


    "zombie-detector":(
       
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  {/* Head */}
  <rect x="7" y="2" width="10" height="9" rx="2" />
  {/* Eyes */}
  <circle cx="10" cy="6" r="1" fill="currentColor" stroke="none" />
  <circle cx="14" cy="6" r="1" fill="currentColor" stroke="none" />
  {/* Mouth - jagged zombie */}
  <path d="M9 9.5h6" />
  {/* Neck */}
  <path d="M10 11v2M14 11v2" />
  {/* Body */}
  <path d="M6 13h12v5H6z" rx="1" />
  {/* Arms outstretched - zombie pose */}
  <path d="M6 14.5L2 13M18 14.5L22 13" />
  {/* Legs */}
  <path d="M9 18v3M15 18v3" />
</svg>

    ),


    alerts: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    cloud: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
    teams: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    budget: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 15h0M2 9.5h20" />
      </svg>
    ),
    reports: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    admin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  }
  return icons[type] || null
}

export default function Sidebar({ collapsed, onToggle }) {
  const currentPath = window.location.pathname

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        </div>
        {!collapsed && <span className={styles.logoText}>Cloudburn</span>}
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link 
            key={item.label} 
            to={item.href} 
            className={`${styles.navItem} ${currentPath === item.href ? styles.active : ''}`}
          >
            <NavIcon type={item.icon} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      <div className={styles.footer}>
        <button className={styles.collapseBtn} onClick={onToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <polyline points="9,18 15,12 9,6" />
            ) : (
              <polyline points="15,18 9,12 15,6" />
            )}
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
        
        <div className={styles.userInfo}>
          <div className={styles.avatar}>AJ</div>
          {!collapsed && (
            <div className={styles.userDetails}>
              <span className={styles.userName}>Alex Johnson</span>
              <span className={styles.userEmail}>alex@company.com</span>
            </div>
          )}
          {!collapsed && (
            <button className={styles.logoutBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
