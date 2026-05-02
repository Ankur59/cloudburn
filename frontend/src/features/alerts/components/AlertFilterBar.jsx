import styles from './AlertFilterBar.module.css';

/**
 * AlertFilterBar
 *
 * Renders the filter controls at the top of the Alerts page.
 * Props:
 *  - filters: { search, type, severity, provider } — current filter values
 *  - onFilterChange: (key, value) => void — called when any filter changes
 *  - onClear: () => void — resets all filters
 */
export default function AlertFilterBar({ filters, onFilterChange, onClear }) {
  return (
    <div className={styles.filterBar}>
      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          id="alert-search"
          type="text"
          placeholder="Search alerts..."
          className={styles.searchInput}
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Type filter */}
      <select
        id="alert-type-filter"
        className={styles.select}
        value={filters.type}
        onChange={(e) => onFilterChange('type', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="Spike">Spike</option>
        <option value="Budget Breach">Budget Breach</option>
        <option value="Anomaly">Anomaly</option>
      </select>

      {/* Severity filter */}
      <select
        id="alert-severity-filter"
        className={styles.select}
        value={filters.severity}
        onChange={(e) => onFilterChange('severity', e.target.value)}
      >
        <option value="">All Severities</option>
        <option value="critical">Critical</option>
        <option value="warning">Warning</option>
      </select>

      {/* Cloud Provider filter */}
      <select
        id="alert-provider-filter"
        className={styles.select}
        value={filters.provider}
        onChange={(e) => onFilterChange('provider', e.target.value)}
      >
        <option value="">All Providers</option>
        <option value="AWS">AWS</option>
        <option value="GCP">GCP</option>
        <option value="Azure">Azure</option>
      </select>

      {/* Clear filters */}
      <button id="alert-clear-filters" className={styles.clearBtn} onClick={onClear}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Clear
      </button>
    </div>
  );
}
