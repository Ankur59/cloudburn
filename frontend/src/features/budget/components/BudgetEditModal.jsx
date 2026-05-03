import { useState } from 'react';
import styles from './BudgetEditModal.module.css';

// The four threshold options shown as pills
const THRESHOLD_OPTIONS = [50, 70, 80, 90];

/**
 * BudgetEditModal
 *
 * Opens when the user clicks "Edit" on a TeamBudgetCard.
 * Lets them change the budget amount and alert threshold for that team.
 *
 * Props:
 *  - team: the team object being edited
 *  - onSave: ({ id, budget, alertThreshold }) => void
 *  - onClose: () => void
 */
export default function BudgetEditModal({ team, onSave, onClose }) {
  // Local state — pre-filled with current team values
  const [budgetValue, setBudgetValue]     = useState(String(team.budget));
  const [threshold, setThreshold]         = useState(team.alertThreshold);

  const handleSave = () => {
    const parsed = parseInt(budgetValue.replace(/,/g, ''), 10);
    if (!parsed || parsed <= 0) return;          // basic validation
    onSave({ id: team.id, budget: parsed, alertThreshold: threshold });
    onClose();
  };

  // Close when clicking the dark overlay behind the modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} id="budget-edit-modal">

        {/* ── Modal Header ── */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Edit Budget</span>
          <button id="close-budget-modal" className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>
          {/* Which team we're editing */}
          <div>
            <p className={styles.teamLabel}>Team</p>
            <p className={styles.teamName}>{team.name}</p>
          </div>

          {/* Budget amount input */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="budget-amount-input">
              Monthly Budget (USD)
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.prefix}>$</span>
              <input
                id="budget-amount-input"
                type="number"
                min="0"
                className={styles.input}
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          {/* Alert threshold selector */}
          <div className={styles.field}>
            <label className={styles.label}>Alert Threshold</label>
            <div className={styles.sliderSection}>
              <div className={styles.thresholdOptions}>
                {THRESHOLD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    id={`threshold-${opt}`}
                    className={`${styles.thresholdPill} ${threshold === opt ? styles.selected : ''}`}
                    onClick={() => setThreshold(opt)}
                  >
                    {opt}%
                  </button>
                ))}
              </div>
              <p className={styles.thresholdHint}>
                You'll receive an alert when spend reaches {threshold}% of the budget.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            <button id="save-budget-btn" className={styles.saveBtn} onClick={handleSave}>
              Save Changes
            </button>
            <button id="cancel-budget-btn" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
