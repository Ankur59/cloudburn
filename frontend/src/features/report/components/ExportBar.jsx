import styles from './ExportBar.module.css';

// Saved reports mock data
const SAVED_REPORTS = [
  { name: 'Q1 2024 Cost Report', date: 'Mar 31, 2024', size: '2.4 MB' },
  { name: 'AWS Monthly — March 2024', date: 'Mar 01, 2024', size: '1.1 MB' },
  { name: 'Team Alpha Budget Review', date: 'Feb 28, 2024', size: '840 KB' },
  { name: 'Q4 2023 Cost Report', date: 'Dec 31, 2023', size: '3.2 MB' },
];

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ExportBar({ data = [], currentFilters = {} }) {
  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("No data to export.");
      return;
    }

    // CSV Headers
    const headers = ["Date", "Raw Date", "Service", "Team", "Cloud", "Cost", "Previous Day Cost", "Delta %", "Credits"];
    
    // CSV Rows
    const rows = data.map(row => [
      `"${row.date || ''}"`,
      `"${row.rawDate || ''}"`,
      `"${row.service || ''}"`,
      `"${row.team || 'Unallocated'}"`,
      `"${row.cloud || row.provider || 'AWS'}"`,
      row.cost || 0,
      row.prev || 0,
      row.delta !== null ? row.delta : '',
      row.credits || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const rangeStr = currentFilters.datePreset || 'custom';
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cloudburn_report_${rangeStr}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.exportSection}>
      {/* Primary action */}
      <div className={styles.exportHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Export</h3>
          <p className={styles.sectionSub}>Download the current report as CSV</p>
        </div>
        <button className={styles.csvBtn} onClick={handleDownload}>
          <DownloadIcon />
          Download CSV
        </button>
      </div>

      {/* Saved reports list */}
      <div className={styles.savedList}>
        <div className={styles.savedHeader}>Saved Reports</div>
        {SAVED_REPORTS.map((r, i) => (
          <div key={i} className={styles.savedRow}>
            <div className={styles.savedMeta}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              <div>
                <span className={styles.savedName}>{r.name}</span>
                <span className={styles.savedDate}>{r.date} · {r.size}</span>
              </div>
            </div>
            <button className={styles.downloadLink} onClick={handleDownload} title="Download">
              <DownloadIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
