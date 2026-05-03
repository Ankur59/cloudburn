import styles from './ZombieFilterBar.module.css';

/**
 * ZombieFilterBar
 *
 * Filter controls: Cloud provider · Resource type · Idle duration.
 *
 * Props:
 *  - filters: { cloud, resourceType, idleDuration }
 *  - onFilterChange: (key, value) => void
 *  - onClear: () => void
 */
export default function ZombieFilterBar({ filters, onFilterChange, onClear }) {
  return (
    <div className={styles.bar}>
      {/* Cloud provider */}
      <select
        id="zombie-cloud-filter"
        className={styles.select}
        value={filters.cloud}
        onChange={(e) => onFilterChange('cloud', e.target.value)}
      >
        <option value="">All Clouds</option>
        <option value="AWS">AWS</option>
        <option value="GCP">GCP</option>
        <option value="Azure">Azure</option>
      </select>

      {/* Resource type */}
      <select
        id="zombie-type-filter"
        className={styles.select}
        value={filters.resourceType}
        onChange={(e) => onFilterChange('resourceType', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="EC2">EC2</option>
        <option value="S3">S3</option>
        <option value="RDS">RDS</option>
        <option value="Elastic IP">Elastic IP</option>
        <option value="Load Balancer">Load Balancer</option>
        <option value="Compute">Compute</option>
        <option value="BigQuery">BigQuery</option>
      </select>

      {/* Idle duration */}
      <select
        id="zombie-idle-filter"
        className={styles.select}
        value={filters.idleDuration}
        onChange={(e) => onFilterChange('idleDuration', e.target.value)}
      >
        <option value="">Any Duration</option>
        <option value="7">Idle &gt; 7 days</option>
        <option value="30">Idle &gt; 30 days</option>
        <option value="90">Idle &gt; 90 days</option>
      </select>

      {/* Clear */}
      <button id="zombie-clear-filters" className={styles.clearBtn} onClick={onClear}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Clear
      </button>
    </div>
  );
}
