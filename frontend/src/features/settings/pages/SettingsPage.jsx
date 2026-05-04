import { useState } from 'react'
import Sidebar from '../../shared/Sidebar'
import Header from '../../dashboard/components/Header'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [userRole] = useState('Org Admin') // Mock role

  // Mock Form States
  const [name, setName] = useState('Alex Johnson')
  const [email, setEmail] = useState('alex@company.com')
  const [orgName, setOrgName] = useState('Acme Corporation')
  
  // Mock Toggle States
  const [alertsCost, setAlertsCost] = useState(true)
  const [alertsBudget, setAlertsBudget] = useState(true)
  const [alertsWeekly, setAlertsWeekly] = useState(false)
  const [alertsAI, setAlertsAI] = useState(true)
  const [alertsZombie, setAlertsZombie] = useState(true)

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'security', label: 'Security' },
    ...(userRole === 'Org Admin' ? [{ id: 'organization', label: 'Organization' }] : []),
    { id: 'danger', label: 'Danger Zone', danger: true },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <h2 className={styles.sectionTitle}>Profile Overview</h2>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>AJ</div>
              <button className={styles.btnSecondary}>Change Avatar</button>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input 
                type="text" 
                className={styles.input} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input 
                type="email" 
                className={styles.input} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <p className={styles.hint}>Changing email requires verification.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <input 
                type="text" 
                className={styles.input} 
                value={userRole} 
                disabled 
              />
            </div>

            <button className={styles.btnPrimary}>Save Changes</button>
          </>
        )
      
      case 'notifications':
        return (
          <>
            <h2 className={styles.sectionTitle}>Notification Preferences</h2>
            
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <h4>Cost Spike Alerts</h4>
                <p>Get notified when unusual cost anomalies are detected.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={alertsCost} onChange={(e) => setAlertsCost(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <h4>Budget Threshold Alerts</h4>
                <p>Receive alerts when teams approach their defined budgets.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={alertsBudget} onChange={(e) => setAlertsBudget(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <h4>Weekly Cost Summary</h4>
                <p>A digest of your organization's weekly spending.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={alertsWeekly} onChange={(e) => setAlertsWeekly(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <h4>AI Insight Notifications</h4>
                <p>Recommendations and cost optimization suggestions.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={alertsAI} onChange={(e) => setAlertsAI(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <h4>Zombie Resource Alerts</h4>
                <p>Notifications for newly detected idle resources.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={alertsZombie} onChange={(e) => setAlertsZombie(e.target.checked)} />
                <span className={styles.slider}></span>
              </label>
            </div>
          </>
        )

      case 'appearance':
        return (
          <>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Theme</label>
              <select className={styles.input}>
                <option value="dark">Dark</option>
                <option value="light" disabled>Light(Comming soon)</option>
                <option value="light" disabled>System(Comming Soon)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Language</label>
              <select className={styles.input}>
                <option value="en">English (US)</option>
              </select>
            </div>
          </>
        )

      case 'security':
        return (
          <>
            <h2 className={styles.sectionTitle}>Security Settings</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input type="password" className={styles.input} />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className={styles.input} />
              <div className={styles.passwordStrength}>
                <div className={`${styles.strengthBar} ${styles.active}`}></div>
                <div className={`${styles.strengthBar} ${styles.active}`}></div>
                <div className={styles.strengthBar}></div>
                <div className={styles.strengthBar}></div>
              </div>
            </div>

            <button className={styles.btnSecondary} style={{ marginBottom: '32px' }}>Update Password</button>

            <h3 className={styles.subSectionTitle}>Two-Factor Authentication</h3>
            <div className={styles.toggleRow} style={{ borderBottom: 'none', paddingBottom: '32px' }}>
              <div className={styles.toggleInfo}>
                <h4 style={{ display: 'flex', alignItems: 'center' }}>
                  Authenticator App
                  <span className={styles.badge}>Coming Soon</span>
                </h4>
                <p>Add an extra layer of security to your account.</p>
              </div>
              <button className={styles.btnSecondary} disabled>Enable</button>
            </div>

            <h3 className={styles.subSectionTitle}>Active Sessions</h3>
            <div className={styles.sessionItem}>
              <div className={styles.sessionDetails}>
                <h4>Windows • Chrome</h4>
                <p>Mumbai, India • Current Session</p>
              </div>
            </div>
            <div className={styles.sessionItem}>
              <div className={styles.sessionDetails}>
                <h4>Mac OS • Safari</h4>
                <p>New York, USA • Last active 2 hours ago</p>
              </div>
              <button className={styles.btnSecondary}>Revoke</button>
            </div>
          </>
        )

      case 'organization':
        return (
          <>
            <h2 className={styles.sectionTitle}>Organization Details</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Name</label>
              <input 
                type="text" 
                className={styles.input} 
                value={orgName} 
                onChange={(e) => setOrgName(e.target.value)} 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Slug</label>
              <input 
                type="text" 
                className={styles.input} 
                value="acme-corporation" 
                disabled 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Total Members</label>
              <input 
                type="text" 
                className={styles.input} 
                value="12 Active Members" 
                disabled 
              />
            </div>
            
            <h3 className={styles.subSectionTitle} style={{ marginTop: '32px' }}>Current Plan</h3>
            <div className={styles.toggleRow} style={{ borderBottom: 'none' }}>
              <div className={styles.toggleInfo}>
                <h4>Pro Tier</h4>
                <p>Up to $50k monthly tracked spend.</p>
              </div>
              <button className={styles.btnSecondary} disabled>
                Upgrade Plan <span className={styles.badge}>Coming Soon</span>
              </button>
            </div>
          </>
        )

      case 'danger':
        return (
          <>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--danger)', borderColor: 'rgba(201, 78, 78, 0.2)' }}>
              Danger Zone
            </h2>
            
            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h4>Leave Organization</h4>
                <p>Revoke your access to Acme Corporation. You will need a new invite to rejoin.</p>
              </div>
              <button className={styles.btnSecondary}>Leave Organization</button>
            </div>

            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h4>Delete Account</h4>
                <p>Permanently delete your account and remove all personal data.</p>
              </div>
              <button className={styles.btnDanger}>Delete Account</button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.page}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Settings</h1>
            <p>Manage your account and preferences</p>
          </div>

          <div className={styles.settingsContainer}>
            
            {/* Desktop / Tablet Tabs */}
            <div className={styles.sidebarNav}>
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''} ${tab.danger ? styles.danger : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Dropdown Nav */}
            <select 
              className={styles.mobileNavSelect} 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>

            {/* Main Tab Content */}
            <div className={`${styles.tabContent} ${activeTab === 'danger' ? styles.dangerCard : ''}`}>
              {renderTabContent()}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
