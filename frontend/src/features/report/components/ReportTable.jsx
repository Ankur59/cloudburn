import { useState, useEffect } from "react";
import styles from "./ReportTable.module.css";

// Real data will be passed in via props

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "service", label: "Service" },
  { key: "team", label: "Team" },
  { key: "cloud", label: "Cloud" },
  { key: "cost", label: "Cost" },
  { key: "delta", label: "vs Previous" },
];

function SortIcon({ active, dir }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ opacity: active ? 1 : 0.3 }}
    >
      {dir === "asc" ? (
        <polyline points="18,15 12,9 6,15" />
      ) : (
        <polyline points="6,9 12,15 18,9" />
      )}
    </svg>
  );
}

export default function ReportTable({
  loading,
  data = [],
  pagination,
  onPageChange,
}) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const cmp =
      typeof aVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const { totalRows = 0, currentPage = 1, pageSize = 50, totalPages = 1 } = pagination || {};
  const start = (currentPage - 1) * pageSize;
  const currentCount = sortedData.length;

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <div className={styles.skeletonHeader} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={styles.skeletonRow}
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      {/* Row count */}
      <div className={styles.rowCount}>
        Showing{" "}
        <span>
          {start + 1}–{Math.min(start + currentCount, totalRows)}
        </span>{" "}
        of <span>{totalRows.toLocaleString()}</span> rows
      </div>

      <div className={styles.scrollArea}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${sortKey === col.key ? styles.thActive : ""}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr key={row.id || Math.random()} className={styles.row}>
                <td className={styles.td}>
                  {row.date}
                </td>
                <td className={styles.td}>{row.service}</td>
                <td className={styles.td}>
                  <span className={styles.teamBadge}>
                    {row.team || "Unallocated"}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.cloudBadge} ${styles[(row.provider || row.cloud || "").toLowerCase()] || ""}`}
                  >
                    {row.provider || row.cloud || "Unknown"}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.mono}`}>
                  ${(row.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className={styles.td}>
                  {row.delta === null ? (
                    <span className={styles.delta} style={{ color: "var(--text-tertiary)" }}>—</span>
                  ) : (
                    <span
                      className={`${styles.delta} ${(row.delta || 0) >= 0 ? styles.up : styles.down}`}
                    >
                      {(row.delta || 0) >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(row.delta || 0)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  No reports data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className={styles.mobileCardList}>
        {sortedData.map((row) => (
          <div key={row.id} className={styles.mobileCard}>
            <div className={styles.cardTopRow}>
              <span className={styles.cardDate}>{row.date}</span>
              <span className={`${styles.cloudBadge} ${styles[(row.provider || row.cloud || '').toLowerCase()]}`}>
                {row.provider || row.cloud}
              </span>
            </div>
            <div className={styles.cardService}>{row.service}</div>
            <div className={styles.cardDivider} />
            <div className={styles.cardMetrics}>
              <div className={styles.cardMetricItem}>
                <span className={styles.cardMetricLabel}>Team</span>
                <span className={styles.teamBadge}>{row.team || 'Unallocated'}</span>
              </div>
              <div className={styles.cardMetricItem}>
                <span className={styles.cardMetricLabel}>Cost</span>
                <span className={styles.cardCost}>${(row.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              </div>
              <div className={styles.cardMetricItem}>
                <span className={styles.cardMetricLabel}>VS Prev</span>
                <span className={`${styles.delta} ${(row.delta || 0) >= 0 ? styles.up : styles.down}`}>
                  {row.delta === null ? '—' : `${(row.delta || 0) >= 0 ? '↑' : '↓'} ${Math.abs(row.delta || 0)}%`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
