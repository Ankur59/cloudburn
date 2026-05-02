import styles from './ZombieBulkBar.module.css';

/**
 * ZombieBulkBar
 *
 * Sticky bar that appears when rows are selected.
 * Shows count, total savings, and bulk action buttons.
 *
 * Props:
 *  - selectedCount: number of selected rows
 *  - totalSavings: string  e.g. "$3,200"
 *  - onMarkAll: () => void
 *  - onExport: () => void
 *  - onClearSelection: () => void
 */
export default function ZombieBulkBar({ selectedCount, totalSavings, onMarkAll, onExport, onClearSelection }) {
  return (
    <div className={styles.bar}>
      {/* Left: selection summary */}
      <div className={styles.info}>
        {selectedCount} selected → Save <span>{totalSavings}/mo</span>
        <button
          id="bulk-clear-selection"
          onClick={onClearSelection}
          style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12 }}
        >
          Clear
        </button>
      </div>

      {/* Right: action buttons */}
      <div className={styles.btnGroup}>
        <button id="bulk-export" className={styles.btn} onClick={onExport}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Selected
        </button>

        <button id="bulk-mark-all" className={`${styles.btn} ${styles.mark}`} onClick={onMarkAll}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Mark All for Cleanup
        </button>
      </div>
    </div>
  );
}
