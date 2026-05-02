import { useState } from "react";
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

  const { total = 0, page = 1, limit = 50, totalPages = 1 } = pagination || {};
  const start = (page - 1) * limit;
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
          {start + 1}–{Math.min(start + currentCount, total)}
        </span>{" "}
        of <span>{total.toLocaleString()}</span> rows
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
              <tr key={row._id || Math.random()} className={styles.row}>
                <td className={styles.td}>
                  {new Date(row.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className={styles.td}>{row.service}</td>
                <td className={styles.td}>
                  <span className={styles.teamBadge}>
                    {row.team || "Unallocated"}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.cloudBadge} ${styles[(row.provider || "").toLowerCase()] || ""}`}
                  >
                    {row.provider || row.cloud}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.mono}`}>
                  ${(row.cost || 0).toLocaleString()}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.delta} ${(row.delta || 0) >= 0 ? styles.up : styles.down}`}
                  >
                    {(row.delta || 0) >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(row.delta || 0)}%
                  </span>
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

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages || 1}
        </span>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
