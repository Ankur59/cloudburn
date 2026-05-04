import { useState } from 'react';
import styles from './AccountCard.module.css';

/**
 * Returns card-level CSS modifier based on account status.
 */
function cardMod(status) {
  if (status === 'Error' || status === 'Expired') return styles.error;
  if (status === 'Syncing') return styles.syncing;
  return '';
}

/**
 * Credentials health bar: pct = 0-100 (100 = fully healthy).
 */
function CredBar({ credHealth }) {
  const { status, label, pct } = credHealth;
  return (
    <div className={styles.credBar}>
      <div className={styles.credLabel}>
        <span>Credentials</span>
        <span className={`${styles.credText} ${styles[status]}`}>{label}</span>
      </div>
      <div className={styles.credTrack}>
        <div className={`${styles.credFill} ${styles[status]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * AccountCard
 *
 * Displays a single connected cloud account with all metadata,
 * credentials health bar, and footer action buttons.
 *
 * Props:
 *  - account: account data object (see MOCK_ACCOUNTS in CloudAccounts.jsx)
 *  - onEdit:   (account) => void
 *  - onRemove: (account) => void
 *  - onSync:   (id) => void
 */
export default function AccountCard({ account, onEdit, onRemove, onSync }) {
  const [copied, setCopied] = useState(false);
  const { id, name, provider, accountId, regions, mtdSpend, lastSynced, status, credHealth } = account;

  const isSyncing = status === 'Syncing';
  const isExpired = status === 'Expired';

  // Copy account ID to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Status badge
  const badgeStatus = status === 'Expired' 
    ? 'error' 
    : status.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${styles.card} ${cardMod(status)}`} id={`account-card-${id}`}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={`${styles.providerIcon} ${styles[provider.toLowerCase()]}`}>
            {provider}
          </div>
          <span className={styles.accountName}>{name}</span>
        </div>

        <span className={`${styles.statusBadge} ${styles[badgeStatus]}`}>
          {isSyncing
            ? <><span className={styles.syncDot} />Syncing…</>
            : <><span className={`${styles.statusDot} ${styles[badgeStatus]}`} />{status}</>
          }
        </span>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Account ID — copyable */}
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Account ID</span>
          <div className={styles.copyRow}>
            <span className={styles.metaValue}>{accountId}</span>
            <button
              id={`copy-${id}`}
              className={styles.copyBtn}
              onClick={handleCopy}
              title="Copy ID"
            >
              {copied
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Regions */}
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Regions</span>
          <span className={styles.metaValue}>{regions.join(', ')}</span>
        </div>

        {/* MTD Spend */}
        <div className={styles.spendRow}>
          <span className={styles.spendLabel}>MTD Spend</span>
          <span className={styles.spendValue}>{mtdSpend}</span>
        </div>

        {/* Credentials health bar */}
        <CredBar credHealth={credHealth} />
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        {isExpired ? (
          <button id={`reconnect-${id}`} className={`${styles.footerBtn} ${styles.reconnectBtn}`} onClick={() => onEdit(account)} disabled={status === 'Coming Soon'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Reconnect
          </button>
        ) : (
          <button
            id={`sync-${id}`}
            className={styles.footerBtn}
            onClick={() => onSync(id)}
            disabled={isSyncing || status === 'Coming Soon'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={isSyncing ? { animation: 'spin 1s linear infinite' } : {}}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            {isSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
        )}

        <button id={`edit-${id}`} className={styles.footerBtn} onClick={() => onEdit(account)} disabled={status === 'Coming Soon'}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>

        <button id={`remove-${id}`} className={`${styles.footerBtn} ${styles.removeBtn}`} onClick={() => onRemove(account)} disabled={status === 'Coming Soon'}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Remove
        </button>

        <span className={styles.lastSync}>{lastSynced}</span>
      </div>

    </div>
  );
}
