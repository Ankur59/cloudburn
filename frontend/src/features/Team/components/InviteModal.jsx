import { useState } from 'react';
import styles from './InviteModal.module.css';

/**
 * InviteModal
 *
 * A modal dialog for inviting a new team member.
 * Shows an email input, role selector, send button,
 * and a list of pending invites below.
 *
 * Props:
 *  - pendingInvites: array of { email, role } objects
 *  - onClose: () => void
 *  - onSendInvite: ({ email, role }) => void
 */
export default function InviteModal({ pendingInvites, onClose, onSendInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');

  // Handle form submission
  const handleSend = () => {
    if (!email.trim()) return;
    onSendInvite({ email: email.trim(), role });
    setEmail('');
    setRole('Developer');
  };

  // Close modal when clicking the dark overlay (outside the box)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} id="invite-modal">

        {/* ── Modal Header ── */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Invite Team Member</span>
          <button id="close-invite-modal" className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Form Fields ── */}
        <div className={styles.modalBody}>
          {/* Email input */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-email">
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              className={styles.input}
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>

          {/* Role selector */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className={styles.select}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Team Lead">Team Lead</option>
              <option value="Developer">Developer</option>
            </select>
          </div>

          {/* Send button */}
          <button
            id="send-invite-btn"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!email.trim()}
          >
            Send Invite
          </button>
        </div>

        {/* ── Pending Invites ── */}
        <div className={styles.pendingSection}>
          <p className={styles.pendingTitle}>Pending Invites</p>

          {pendingInvites.length === 0 ? (
            <p className={styles.noPending}>No pending invites</p>
          ) : (
            <div className={styles.pendingList}>
              {pendingInvites.map((invite, idx) => (
                <div key={idx} className={styles.pendingItem}>
                  <span className={styles.pendingEmail}>{invite.email}</span>
                  <div className={styles.pendingMeta}>
                    <span className={styles.pendingRole}>{invite.role}</span>
                    <span className={styles.pendingBadge}>Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
