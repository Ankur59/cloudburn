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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({ datePreset: '30d' });
  
  // Real data state from Redux
  const { data, pagination, loading } = useSelector((state) => state.report);
  const { user } = useSelector((state) => state.auth);
  const { handleGetReports } = useReport();

  const currentOrg = user?.orgName || 'Acme Corporation';
  const organizations = [currentOrg];

  const fetchWithFilters = (page, limit, filters) => {
    let startDate = null;
    let endDate = null;
    
    if (filters.datePreset && filters.datePreset !== 'Custom') {
      const days = parseInt(filters.datePreset.replace('d', ''), 10);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      
      endDate = end.toISOString().split('T')[0];
      startDate = start.toISOString().split('T')[0];
    }
    
    // For Custom, we would ideally take startDate/endDate from filters if they exist
    if (filters.startDate && filters.endDate) {
      startDate = filters.startDate;
      endDate = filters.endDate;
    }

    const provider = filters.provider || null;
    const team = filters.team || null;

    handleGetReports(page, limit, startDate, endDate, provider, team);
  };

  useEffect(() => {
    fetchWithFilters(1, 50, currentFilters);
  }, []);

  const handleGenerate = (filters) => {
    setCurrentFilters(filters);
    fetchWithFilters(1, pagination.pageSize || 50, filters);
  };

  const handlePageChange = (newPage) => {
    fetchWithFilters(newPage, pagination.pageSize || 50, currentFilters);
  };

  return (
    <div className={styles.page}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={() => {}}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1>Reports & Analytics</h1>
              <p>Export and analyze your cloud cost data across providers and teams</p>
            </div>
          </div>

          <FilterBar onGenerate={handleGenerate} loading={loading} />

          <ReportTable 
            loading={loading} 
            data={data} 
            pagination={pagination} 
            onPageChange={handlePageChange} 
          />

          <ExportBar data={data} currentFilters={currentFilters} />
        </div>
      </div>
    </div>
  );
}
