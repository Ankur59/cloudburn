import { useState } from 'react';
import styles from './InviteModal.module.css'; // Reusing similar modal styles

export default function CreateTeamModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState(1000);
  const [threshold, setThreshold] = useState(80);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ 
      name: name.trim(), 
      budgetLimit: Number(budget), 
      alertThreshold: Number(threshold), 
      notes: notes.trim() 
    });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} style={{ maxWidth: '450px' }}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create New Team</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>Team Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Platform Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Monthly Budget ($)</label>
              <input
                type="number"
                className={styles.input}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Alert Threshold (%)</label>
              <input
                type="number"
                className={styles.input}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Internal Notes (Optional)</label>
            <textarea
              className={styles.input}
              style={{ minHeight: '80px', padding: '10px' }}
              placeholder="Team purpose, owner, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.sendBtn} style={{ marginTop: '8px' }}>
            Create Team
          </button>
        </form>
      </div>
    </div>
  );
}
