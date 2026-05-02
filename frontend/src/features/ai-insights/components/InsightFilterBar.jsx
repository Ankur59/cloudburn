import styles from './InsightFilterBar.module.css';

/**
 * InsightFilterBar
 *
 * Lets users filter insights by priority + service tag,
 * and toggle sort direction by savings amount.
 *
 * Props:
 *  - filters: { priority, service, sortDesc }
 *  - onFilterChange: (key, value) => void
 *  - onToggleSort: () => void
 */
export default function InsightFilterBar({ filters, onFilterChange, onToggleSort }) {
  return (
    <div className={styles.filterBar}>
      {/* Priority filter */}
      <select
        id="insight-priority-filter"
        className={styles.select}
        value={filters.priority}
        onChange={(e) => onFilterChange('priority', e.target.value)}
      >
        <option value="">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="low">Low</option>
      </select>

      {/* Service filter */}
      <select
        id="insight-service-filter"
        className={styles.select}
        value={filters.service}
        onChange={(e) => onFilterChange('service', e.target.value)}
      >
        <option value="">All Services</option>
        <option value="AWS · EC2">AWS · EC2</option>
        <option value="AWS · S3">AWS · S3</option>
        <option value="AWS · RDS">AWS · RDS</option>
        <option value="GCP · BigQuery">GCP · BigQuery</option>
        <option value="GCP · Compute">GCP · Compute</option>
        <option value="Azure · Functions">Azure · Functions</option>
      </select>

      {/* Sort by savings */}
      <button
        id="insight-sort-btn"
        className={styles.sortBtn}
        onClick={onToggleSort}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
        Savings {filters.sortDesc ? '↓ High to Low' : '↑ Low to High'}
      </button>
    </div>
  );
}
