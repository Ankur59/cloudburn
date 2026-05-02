import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useReport } from '../hooks/useReport';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import FilterBar from '../components/FilterBar';
import ReportTable from '../components/ReportTable';
import ExportBar from '../components/ExportBar';
import styles from './Reports.module.css';

export default function Reports() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Real data state from Redux
  const { data, pagination, loading } = useSelector((state) => state.report);
  const { user } = useSelector((state) => state.auth);
  const { handleGetReports } = useReport();

  const currentOrg = user?.orgName || 'Acme Corporation';
  const organizations = [currentOrg];

  useEffect(() => {
    handleGetReports(1, 50);
  }, [handleGetReports]);

  // Simulate report generation (you can adapt this to filters later)
  const handleGenerate = (filters) => {
    handleGetReports(1, 50);
  };

  const handlePageChange = (newPage) => {
    handleGetReports(newPage, pagination.limit);
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
          onOrgChange={() => {}}
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

          <ReportTable 
            loading={loading} 
            data={data} 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />

          {/* Export section */}
          <ExportBar />
        </div>
      </div>
    </div>
  );
}
