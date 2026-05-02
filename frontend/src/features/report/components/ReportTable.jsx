import { useState } from 'react';
import styles from './ReportTable.module.css';

// ─── Mock data ────────────────────────────────────────────────
const MOCK_ROWS = Array.from({ length: 120 }, (_, i) => {
  const services = ['EC2', 'S3', 'RDS', 'Lambda', 'CloudFront', 'Pub/Sub', 'BigQuery', 'GKE', 'Blob Storage', 'AKS'];
  const teams    = ['Team Alpha', 'Team Beta', 'Platform', 'Data'];
  const clouds   = ['AWS', 'GCP', 'Azure'];
  const cost     = +(Math.random() * 4000 + 50).toFixed(2);
  const prev     = +(cost * (0.7 + Math.random() * 0.6)).toFixed(2);
  const delta    = +(((cost - prev) / prev) * 100).toFixed(1);

  const date = new Date(2024, 3, 1 + (i % 30));
  return {
    id: i + 1,
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    service: services[i % services.length],
    team: teams[i % teams.length],
    cloud: clouds[i % clouds.length],
    cost,
    prev,
    delta,
  };
});

const PAGE_SIZE = 50;

const COLUMNS = [
  { key: 'date',    label: 'Date' },
  { key: 'service', label: 'Service' },
  { key: 'team',    label: 'Team' },
  { key: 'cloud',   label: 'Cloud' },
  { key: 'cost',    label: 'Cost' },
  { key: 'delta',   label: 'vs Previous' },
];

function SortIcon({ active, dir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ opacity: active ? 1 : 0.3 }}>
      {dir === 'asc'
        ? <polyline points="18,15 12,9 6,15" />
        : <polyline points="6,9 12,15 18,9" />
      }
    </svg>
  );
}

export default function ReportTable({ loading }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const sorted = [...MOCK_ROWS].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const cmp  = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalRows   = sorted.length;
  const totalPages  = Math.ceil(totalRows / PAGE_SIZE);
  const start       = page * PAGE_SIZE;
  const pageRows    = sorted.slice(start, start + PAGE_SIZE);

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <div className={styles.skeletonHeader} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow} style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      {/* Row count */}
      <div className={styles.rowCount}>
        Showing <span>{start + 1}–{Math.min(start + PAGE_SIZE, totalRows)}</span> of{' '}
        <span>{totalRows.toLocaleString()}</span> rows
      </div>

      <div className={styles.scrollArea}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`${styles.th} ${sortKey === col.key ? styles.thActive : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className={styles.row}>
                <td className={styles.td}>{row.date}</td>
                <td className={styles.td}>{row.service}</td>
                <td className={styles.td}>
                  <span className={styles.teamBadge}>{row.team}</span>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.cloudBadge} ${styles[row.cloud.toLowerCase()]}`}>
                    {row.cloud}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.mono}`}>${row.cost.toLocaleString()}</td>
                <td className={styles.td}>
                  <span className={`${styles.delta} ${row.delta >= 0 ? styles.up : styles.down}`}>
                    {row.delta >= 0 ? '↑' : '↓'} {Math.abs(row.delta)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>Page {page + 1} of {totalPages}</span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
