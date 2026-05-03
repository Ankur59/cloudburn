'use client'

import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../auth/hook/useAuth'
import styles from './Header.module.css'

export default function Header({ onMenuClick }) {
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  
  const orgRef = useRef(null)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  const { user } = useSelector((state) => state.auth)
  const { handleLogout } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (orgRef.current && !orgRef.current.contains(event.target)) {
        setOrgDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false)
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = [
    {
      type: 'critical',
      title: 'Cost spike detected',
      description: 'AWS EC2 costs increased by 45% in the last 24 hours',
    },
    {
      type: 'warning',
      title: 'Budget threshold warning',
      description: 'Team Alpha has reached 80% of monthly budget',
    },
  ]

  const onLogoutClick = async () => {
    setUserDropdownOpen(false)
    const res = await handleLogout()
    if (res.success) {
      navigate('/login')
    }
  }

  const currentOrg = user?.orgName || 'Select Organization'
  const userName = user?.name || 'User'
  const userEmail = user?.email || ''
  const userRole = user?.role || 'Member'
  
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuButton} onClick={onMenuClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className={styles.orgSelector} ref={orgRef}>
          <button 
            className={styles.orgButton}
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>{currentOrg}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
          
          {orgDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>Organizations</div>
              <button 
                className={`${styles.dropdownItem} ${styles.active}`}
                onClick={() => setOrgDropdownOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                {currentOrg}
              </button>
            </div>
          )}
        </div>
        
        <span className={styles.badge}>{userRole}</span>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.notifWrapper} ref={notifRef}>
          <button 
            className={styles.iconButton}
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notifBadge}>2</span>
          </button>
          
          {notifDropdownOpen && (
            <div className={`${styles.dropdown} ${styles.notifDropdown}`}>
              <div className={styles.dropdownHeader}>Notifications</div>
              {notifications.map((notif, idx) => (
                <div key={idx} className={styles.notifItem}>
                  <span className={`${styles.notifDot} ${styles[notif.type]}`} />
                  <div className={styles.notifContent}>
                    <span className={styles.notifTitle}>{notif.title}</span>
                    <span className={styles.notifDesc}>{notif.description}</span>
                  </div>
                </div>
              ))}
              <a href="#" className={styles.viewAllLink}>View all alerts</a>
            </div>
          )}
        </div>
        
        <div className={styles.userWrapper} ref={userRef}>
          <button 
            className={styles.userButton}
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            <div className={styles.userAvatar}>{initials}</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
          
          {userDropdownOpen && (
            <div className={`${styles.dropdown} ${styles.userDropdown}`}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userEmail}>{userEmail}</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </button>
              <button className={styles.dropdownItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <div className={styles.dropdownDivider} />
              <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={onLogoutClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
