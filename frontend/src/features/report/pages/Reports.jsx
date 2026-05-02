import { useState } from 'react';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import FilterBar from '../components/FilterBar';
import ReportTable from '../components/ReportTable';
import ExportBar from '../components/ExportBar';
import styles from './Reports.module.css';

export default function Reports() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg] = useState('Acme Corporation');
  const [loading, setLoading] = useState(false);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // Simulate report generation
  const handleGenerate = (filters) => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className={styles.page}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <div>
              <h1>Reports & Analytics</h1>
              <p>Export and analyze your cloud cost data across providers and teams</p>
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar onGenerate={handleGenerate} loading={loading} />

          {/* Report table */}
          <ReportTable loading={loading} />

          {/* Export section */}
          <ExportBar />
        </div>
      </div>
    </div>
  );
}
