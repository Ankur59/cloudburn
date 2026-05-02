import { useState } from 'react';
import styles from './AccountEditDrawer.module.css';

// Required permissions list for each provider
const PERMISSIONS = {
  AWS:   ['ec2:DescribeInstances', 'rds:DescribeDBInstances', 's3:ListAllMyBuckets', 'ce:GetCostAndUsage', 'cloudwatch:GetMetricData'],
  GCP:   ['compute.instances.list', 'bigquery.datasets.get', 'monitoring.timeSeries.list', 'billing.accounts.get'],
  Azure: ['Microsoft.Compute/virtualMachines/read', 'Microsoft.Storage/storageAccounts/read', 'Microsoft.Billing/billingAccounts/read'],
};

/**
 * AccountEditDrawer
 * Slides in from right to let user edit account nickname + credentials.
 * Shows permissions checker with green/red ticks.
 *
 * Props:
 *  - account: account object being edited
 *  - onSave: (updatedAccount) => void
 *  - onClose: () => void
 */
export default function AccountEditDrawer({ account, onSave, onClose }) {
  const [nickname, setNickname] = useState(account.name);
  const [showKey, setShowKey]   = useState(false);

  // Permissions — mock: first N are valid, rest are invalid (to demo both states)
  const perms = PERMISSIONS[account.provider] || [];
  const validCount = account.credHealth.status === 'healthy' ? perms.length : perms.length - 1;

  const handleSave = () => {
    onSave({ ...account, name: nickname });
    onClose();
  };

  // Close on overlay click
  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.drawer} id="account-edit-drawer">

        {/* ── Header ── */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Edit Account</span>
          <button id="close-edit-drawer" className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.drawerBody}>

          {/* Nickname — editable */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="account-nickname">Account Nickname</label>
            <input
              id="account-nickname"
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Production AWS"
            />
          </div>

          {/* Provider — read only */}
          <div className={styles.field}>
            <label className={styles.label}>Provider</label>
            <input className={styles.input} value={account.provider} readOnly />
          </div>

          {/* Account ID — read only */}
          <div className={styles.field}>
            <label className={styles.label}>Account / Project ID</label>
            <input className={`${styles.input} ${styles.inputMono}`} value={account.accountId} readOnly />
          </div>

          <div className={styles.divider} />

          {/* Credentials — masked, re-enterable */}
          <div className={styles.field}>
            <label className={styles.label}>Access Key / Credentials</label>
            <div className={styles.maskedRow}>
              <input
                id="account-credential"
                className={`${styles.input} ${styles.maskedInput} ${styles.inputMono}`}
                type={showKey ? 'text' : 'password'}
                defaultValue="AKIAIOSFODNN7EXAMPLE"
                placeholder="Paste new credentials..."
              />
              <button className={styles.showBtn} onClick={() => setShowKey((p) => !p)}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Permissions checker */}
          <div className={styles.field}>
            <label className={styles.label}>Permission Health</label>
            <div className={styles.permissionsList}>
              {perms.map((perm, i) => {
                const isOk = i < validCount;
                return (
                  <div key={perm} className={styles.permRow}>
                    <span className={`${styles.permIcon} ${isOk ? styles.ok : styles.bad}`}>
                      {isOk
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </span>
                    <span>{perm}</span>
                  </div>
                );
              })}
            </div>

            <button id="revalidate-perms-btn" className={styles.revalidateBtn}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Re-validate Permissions
            </button>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className={styles.drawerFooter}>
          <button id="save-account-btn" className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
          <button id="cancel-edit-btn" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </div>

      </div>
    </div>
  );
}
