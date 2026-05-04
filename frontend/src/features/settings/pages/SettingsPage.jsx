import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../../shared/Sidebar'
import Header from '../../dashboard/components/Header'
import styles from './SettingsPage.module.css'
import { updateUserProfile } from '../../auth/auth.slice'
import { getProfileApi, updateProfileApi, changePasswordApi, leaveOrgApi, removeAvatarApi } from '../settings.api'
import useAuth from '../../auth/hook/useAuth'

export default function SettingsPage() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleLogout } = useAuth()
  const { user }   = useSelector((s) => s.auth)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')

  // ── Profile state ──────────────────────────────────────────────────────────
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [orgName,     setOrgName]     = useState('')
  const [avatarUrl,   setAvatarUrl]   = useState(null)
  const [avatarFile,  setAvatarFile]  = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileInputRef = useRef(null)

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdStrength, setPwdStrength] = useState(0)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)  // { msg, type: 'success'|'error' }
  const [leaveConfirm, setLeaveConfirm] = useState(false)

  const userRole = user?.role || 'Member'

  const tabs = [
    { id: 'profile',       label: 'Profile' },
    { id: 'security',      label: 'Security' },
    { id: 'appearance',    label: 'Appearance' },
    ...(userRole === 'Admin' ? [{ id: 'organization', label: 'Organization' }] : []),
    { id: 'danger',        label: 'Danger Zone', danger: true },
  ]

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfileApi()
        const data = res.data?.data
        setName(data.name || '')
        setEmail(data.email || '')
        setOrgName(data.orgName || '')
        setAvatarUrl(data.avatar || null)
      } catch {
        setName(user?.name || '')
        setEmail(user?.email || '')
      }
    }
    loadProfile()
  }, [user])

  // ── Password strength ──────────────────────────────────────────────────────
  useEffect(() => {
    let score = 0
    if (newPwd.length >= 8)                    score++
    if (/[A-Z]/.test(newPwd))                  score++
    if (/[0-9]/.test(newPwd))                  score++
    if (/[^A-Za-z0-9]/.test(newPwd))           score++
    setPwdStrength(score)
  }, [newPwd])

  // ── Avatar preview ─────────────────────────────────────────────────────────
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // ── Remove Avatar ──────────────────────────────────────────────────────────
  const handleRemoveAvatar = async () => {
    setSaving(true)
    try {
      await removeAvatarApi()
      dispatch(updateUserProfile({ avatar: null }))
      setAvatarUrl(null)
      setAvatarFile(null)
      setAvatarPreview(null)
      showToast('Avatar removed successfully!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to remove avatar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      if (name.trim()) fd.append('name', name.trim())
      if (avatarFile)  fd.append('avatar', avatarFile)

      const res  = await updateProfileApi(fd)
      const data = res.data?.data
      dispatch(updateUserProfile({ name: data.name, avatar: data.avatar }))
      setAvatarUrl(data.avatar)
      setAvatarFile(null)
      setAvatarPreview(null)
      showToast('Profile updated successfully!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) return showToast('Fill all password fields', 'error')
    if (newPwd !== confirmPwd) return showToast('New passwords do not match', 'error')
    if (newPwd.length < 8)    return showToast('Password must be at least 8 characters', 'error')
    setSaving(true)
    try {
      await changePasswordApi({ currentPassword: currentPwd, newPassword: newPwd })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      showToast('Password changed successfully!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Leave Org ──────────────────────────────────────────────────────────────
  const handleLeaveOrg = async () => {
    if (!leaveConfirm) return setLeaveConfirm(true)
    setSaving(true)
    try {
      await leaveOrgApi()
      showToast('You have left the organization')
      setTimeout(async () => {
        await handleLogout()
        navigate('/login')
      }, 1500)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to leave organization', 'error')
    } finally {
      setSaving(false)
      setLeaveConfirm(false)
    }
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']

  // ── Tab content ────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {

      case 'profile':
        return (
          <>
            <h2 className={styles.sectionTitle}>Profile Overview</h2>

            {/* Avatar */}
            <div className={styles.avatarSection}>
              <div
                className={styles.avatarWrapper}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change avatar"
              >
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
                    alt="Avatar"
                    className={styles.avatarImg}
                  />
                ) : (
                  <div className={styles.avatar}>{initials}</div>
                )}
                <div className={styles.avatarOverlay}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
              <div className={styles.avatarInfo}>
                <p className={styles.avatarHint}>Click avatar to change. Max 5MB · JPG, PNG, WebP</p>
                {avatarFile && <p className={styles.avatarPending}>📎 {avatarFile.name} selected</p>}
                {(avatarUrl && !avatarFile) && (
                  <button
                    className={styles.removeAvatarBtn}
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    title="Remove current avatar"
                  >
                    ✕ Remove current picture
                  </button>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                disabled
              />
              <p className={styles.hint}>Email changes are not supported yet.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <input type="text" className={styles.input} value={userRole} disabled />
            </div>

            <button
              className={styles.btnPrimary}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )

      case 'security':
        return (
          <>
            <h2 className={styles.sectionTitle}>Security Settings</h2>

            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input
                type="password"
                className={styles.input}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className={styles.input}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Min 8 characters"
              />
              {newPwd && (
                <div className={styles.passwordStrengthWrapper}>
                  <div className={styles.passwordStrength}>
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={styles.strengthBar}
                        style={{ background: i <= pwdStrength ? strengthColors[pwdStrength] : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColors[pwdStrength] }}>
                    {strengthLabels[pwdStrength]}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>

            <button
              className={styles.btnSecondary}
              onClick={handleChangePassword}
              disabled={saving}
              style={{ marginBottom: '32px' }}
            >
              {saving ? 'Updating…' : 'Update Password'}
            </button>

            <h3 className={styles.subSectionTitle}>Two-Factor Authentication</h3>
            <div className={styles.toggleRow} style={{ borderBottom: 'none', paddingBottom: '32px' }}>
              <div className={styles.toggleInfo}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Authenticator App
                  <span className={styles.badge}>Coming Soon</span>
                </h4>
                <p>Add an extra layer of security to your account.</p>
              </div>
              <button className={styles.btnSecondary} disabled>Enable</button>
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

      case 'organization':
        return (
          <>
            <h2 className={styles.sectionTitle}>Organization Details</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Name</label>
              <input type="text" className={styles.input} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Your Role</label>
              <input type="text" className={styles.input} value={userRole} disabled />
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
            <h2 className={styles.sectionTitle} style={{ color: 'var(--danger)', borderColor: 'rgba(201,78,78,0.2)' }}>
              Danger Zone
            </h2>

            <div className={styles.dangerRow}>
              <div className={styles.dangerInfo}>
                <h4>Leave Organization</h4>
                <p>
                  {userRole === 'Admin'
                    ? 'Admins cannot leave. Transfer ownership first.'
                    : `Revoke your access to ${orgName || 'this organization'}. You will need a new invite to rejoin.`}
                </p>
              </div>
              {userRole !== 'Admin' && (
                <button
                  className={leaveConfirm ? styles.btnDanger : styles.btnSecondary}
                  onClick={handleLeaveOrg}
                  disabled={saving}
                >
                  {leaveConfirm ? '⚠️ Confirm Leave' : 'Leave Organization'}
                </button>
              )}
              {userRole === 'Admin' && (
                <button className={styles.btnSecondary} disabled>Leave Organization</button>
              )}
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

          {/* Toast */}
          {toast && (
            <div className={`${styles.toast} ${styles[toast.type]}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
            </div>
          )}

          <div className={styles.settingsContainer}>

            {/* Desktop Sidebar Nav */}
            <div className={styles.sidebarNav}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''} ${tab.danger ? styles.danger : ''}`}
                  onClick={() => { setActiveTab(tab.id); setLeaveConfirm(false) }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <select
              className={styles.mobileNavSelect}
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>

            {/* Content */}
            <div className={`${styles.tabContent} ${activeTab === 'danger' ? styles.dangerCard : ''}`}>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
