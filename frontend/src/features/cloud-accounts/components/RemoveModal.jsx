import styles from './RemoveModal.module.css';

/**
 * RemoveModal
 * Confirmation dialog before deleting an account.
 *
 * Props:
 *  - account: the account being removed
 *  - onConfirm: () => void
 *  - onClose: () => void
 */
export default function RemoveModal({ account, onConfirm, onClose }) {
  if (!account) return null;

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.modal} id="remove-account-modal">

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Remove Account</span>
          <button id="close-remove-modal" className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.question}>
            Are you sure you want to remove{' '}
            <span className={styles.accountName}>{account.name}</span>?
          </p>

          <p className={styles.warning}>
            All historical data for this account will be retained but no new data will be synced.
            This action cannot be undone.
          </p>

          <div className={styles.actions}>
            <button id="cancel-remove-btn" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button id="confirm-remove-btn" className={styles.removeBtn} onClick={() => { onConfirm(account.id); onClose(); }}>
              Remove Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
