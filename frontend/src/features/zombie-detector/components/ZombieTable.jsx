import styles from './ZombieTable.module.css';

// Resource type → small SVG icon
function ResourceIcon({ type }) {
  const iconMap = {
    EC2: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    S3: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    RDS: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    default: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
    ),
  };
  return iconMap[type] || iconMap.default;
}

// Returns CSS class for idle duration badge colouring
function idleClass(days) {
  if (days >= 30) return styles.idleRed;
  if (days >= 7)  return styles.idleAmber;
  return styles.idleGray;
}

/**
 * ZombieTable
 *
 * Sortable, selectable table of zombie resources.
 *
 * Props:
 *  - resources: array of resource objects to display
 *  - selectedIds: Set of selected resource IDs
 *  - onToggleSelect: (id) => void
 *  - onToggleSelectAll: () => void
 *  - onReview: (resource) => void  — opens the drawer
 *  - onMark: (id) => void          — marks for cleanup
 *  - sortKey: string               — current sort column key
 *  - sortDesc: boolean
 *  - onSort: (key) => void
 */
export default function ZombieTable({
  resources, selectedIds, onToggleSelect, onToggleSelectAll,
  onReview, onMark, sortKey, sortDesc, onSort,
}) {
  const allSelected = resources.length > 0 && selectedIds.size === resources.length;

  // Render a sortable column header
  const SortTh = ({ colKey, label }) => (
    <th className={styles.sortable} onClick={() => onSort(colKey)}>
      {label}
      <span className={styles.sortIcon}>
        {sortKey === colKey ? (sortDesc ? '↓' : '↑') : '↕'}
      </span>
    </th>
  );

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {/* Select all checkbox */}
            <th className={styles.checkboxCell}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                id="zombie-select-all"
              />
            </th>
            <SortTh colKey="resourceType" label="Type" />
            <SortTh colKey="resourceId"   label="Resource ID" />
            <SortTh colKey="cloud"        label="Cloud" />
            <SortTh colKey="idleDays"     label="Idle Duration" />
            <SortTh colKey="costNum"      label="Cost/Month" />
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody className={styles.tableBody}>
          {resources.map((r) => {
            const isSelected = selectedIds.has(r.id);
            return (
              <tr
                key={r.id}
                id={`zombie-row-${r.id}`}
                className={isSelected ? styles.selected : ''}
              >
                {/* Checkbox */}
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(r.id)}
                  />
                </td>

                {/* Resource Type */}
                <td>
                  <div className={styles.resourceCell}>
                    <div className={styles.resourceIcon}>
                      <ResourceIcon type={r.resourceType} />
                    </div>
                    <span className={styles.resourceName}>{r.resourceType}</span>
                  </div>
                </td>

                {/* Resource ID */}
                <td><span className={styles.resourceId}>{r.resourceId}</span></td>

                {/* Cloud badge */}
                <td>
                  <span className={`${styles.cloudBadge} ${styles[r.cloud.toLowerCase()]}`}>
                    {r.cloud}
                  </span>
                </td>

                {/* Idle duration — coloured by age */}
                <td>
                  <span className={idleClass(r.idleDays)}>
                    {r.idleDays}d idle
                  </span>
                </td>

                {/* Cost */}
                <td><span className={styles.costCell}>{r.costPerMonth}</span></td>

                {/* Status badge */}
                <td>
                  <span className={`${styles.statusBadge} ${styles[r.status.toLowerCase()]}`}>
                    {r.status}
                  </span>
                </td>

                {/* Row actions */}
                <td>
                  <div className={styles.actions}>
                    <button
                      id={`review-${r.id}`}
                      className={styles.actionBtn}
                      onClick={() => onReview(r)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Review
                    </button>

                    {r.status === 'Zombie' && (
                      <button
                        id={`mark-${r.id}`}
                        className={`${styles.actionBtn} ${styles.markBtn}`}
                        onClick={() => onMark(r.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        Mark
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
