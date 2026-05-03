"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useAuth from "../auth/hook/useAuth";
import styles from "./Sidebar.module.css";
import { Link } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "alerts", label: "Alerts", href: "/alerts" },
  { icon: "ai-insights", label: "AI Insights", href: "/ai-insights" },
  { icon: "ask-ai", label: "Ask AI", href: "/ask-ai" },
  {
    icon: "zombie-detector",
    label: "Zombie Detector",
    href: "/zombie-detector",
  },
  { icon: "cloud", label: "Cloud Accounts", href: "/cloud-accounts" },
  { icon: "teams", label: "Teams", href: "/teams" },
  { icon: "budget", label: "Budget", href: "/budget" },
  { icon: "reports", label: "Reports", href: "/reports" },
  { icon: "admin", label: "Admin", href: "#" },
];

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
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" strokeLinecap="round" />
      </svg>
    ),
    "ask-ai": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    "zombie-detector": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="9" rx="2" />
        <circle cx="10" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="14" cy="6" r="1" fill="currentColor" stroke="none" />
        <path d="M9 9.5h6" />
        <path d="M10 11v2M14 11v2" />
        <path d="M6 13h12v5H6z" rx="1" />
        <path d="M6 14.5L2 13M18 14.5L22 13" />
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
    admin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  };
  return icons[type] || null;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const currentPath = window.location.pathname;

  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const userName = user?.name || "Alex Johnson";
  const userEmail = user?.email || "alex@company.com";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Close profile popup on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogoutClick = async () => {
    setProfileOpen(false);
    if (mobileOpen) onMobileClose();
    const res = await handleLogout();
    if (res?.success) navigate("/login");
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ""}`}
        onClick={onMobileClose}
      />
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          </div>
          {(!collapsed || mobileOpen) && (
            <span className={styles.logoText}>Cloudburn</span>
          )}
          <button className={styles.mobileCloseBtn} onClick={onMobileClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`${styles.navItem} ${currentPath === item.href ? styles.active : ""}`}
              onClick={() => { if (mobileOpen) onMobileClose(); }}
            >
              <NavIcon type={item.icon} />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer with profile popup */}
        <div className={styles.footer}>
          {/* Collapse toggle — hidden on mobile */}
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

          {/* Profile row — clickable → shows popup */}
          <div className={styles.profileWrapper} ref={profileRef}>
            {/* Profile Dropup Menu */}
            {profileOpen && (
              <div className={styles.profileDropup}>
                <div className={styles.profileDropupHeader}>
                  <span className={styles.profileDropupName}>{userName}</span>
                  <span className={styles.profileDropupEmail}>{userEmail}</span>
                </div>
                <div className={styles.profileDropupDivider} />
                <button className={styles.profileDropupItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </button>
                <button className={styles.profileDropupItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
                <div className={styles.profileDropupDivider} />
                <button className={`${styles.profileDropupItem} ${styles.profileDropupLogout}`} onClick={onLogoutClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            )}

            {/* Avatar row button */}
            <button
              className={styles.userInfo}
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
            >
              <div className={styles.avatar}>{initials}</div>
              {(!collapsed || mobileOpen) && (
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{userName}</span>
                  <span className={styles.userEmail}>{userEmail}</span>
                </div>
              )}
              {(!collapsed || mobileOpen) && (
                <svg
                  className={`${styles.profileChevron} ${profileOpen ? styles.profileChevronOpen : ""}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="18,15 12,9 6,15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
