import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTeamBudgets, updateTeamBudget } from '../budget.slice';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import GlobalBudgetCard from '../components/GlobalBudgetCard';
import TeamBudgetCard from '../components/TeamBudgetCard';
import BudgetEditModal from '../components/BudgetEditModal';
import styles from './Budget.module.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// All monetary values are plain numbers (USD). Components format them.

// Org-level budget summary
const INITIAL_GLOBAL_BUDGET = {
  totalBudget:    100000,   // $100,000 monthly budget
  currentSpend:    74600,   // spent so far this month
  projectedSpend: 108000,   // projected by month-end
  lastMonth:       68200,   // what was spent last month
};

// Per-team budgets
// alertThreshold = the % at which an alert fires (e.g. 80 = 80%)
const INITIAL_TEAM_BUDGETS = [
  { id: 'tb-1', name: 'Platform Engineering', provider: 'AWS',   currentSpend: 24840, budget: 30000, alertThreshold: 80 },
  { id: 'tb-2', name: 'Data & Analytics',     provider: 'GCP',   currentSpend: 41200, budget: 40000, alertThreshold: 80 },  // over budget!
  { id: 'tb-3', name: 'Frontend Products',    provider: 'Azure', currentSpend:  8560, budget: 15000, alertThreshold: 70 },
  { id: 'tb-4', name: 'Security & Compliance',provider: 'AWS',   currentSpend:     0, budget:  5000, alertThreshold: 90 },
  { id: 'tb-5', name: 'ML Infrastructure',    provider: 'GCP',   currentSpend: 18400, budget: 20000, alertThreshold: 80 },  // approaching limit
  { id: 'tb-6', name: 'DevOps & Release',     provider: 'AWS',   currentSpend:  4200, budget:  8000, alertThreshold: 70 },
];

// ─── Budget Page ──────────────────────────────────────────────────────────────
export default function Budget() {
  const dispatch = useDispatch();
  const { teamBudgets } = useSelector((state) => state.budget);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentOrg, setCurrentOrg]             = useState('Acme Corporation');
  const [editingTeam, setEditingTeam]           = useState(null); // team being edited, or null

  useEffect(() => {
    if (teamBudgets.length === 0) {
      dispatch(setTeamBudgets(INITIAL_TEAM_BUDGETS));
    }
  }, [dispatch, teamBudgets.length]);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // Recompute org totals live from team data
  const globalBudget = {
    ...INITIAL_GLOBAL_BUDGET,
    totalBudget:  teamBudgets.reduce((sum, t) => sum + t.budget, 0),
    currentSpend: teamBudgets.reduce((sum, t) => sum + t.currentSpend, 0),
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Open the edit modal for a specific team
  const handleEdit = (team) => setEditingTeam(team);

  // Save updated budget + threshold back into state
  const handleSave = ({ id, budget, alertThreshold }) => {
    dispatch(updateTeamBudget({ id, budget, alertThreshold }));
    setEditingTeam(null);
  };

  return (
    <div className={styles.page}>
      {/* Sidebar — shared across all pages */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        {/* Top bar */}
        <Header onMenuToggle={() => setMobileSidebarOpen(true)}
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>
          {/* Page heading */}
          <div className={styles.pageHeader}>
            <div>
              <h1>Budget Management</h1>
              <p>Set limits, track spend, and prevent overspend across all teams</p>
            </div>
          </div>

          {/* ── Global Budget Card ── */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Organisation Overview</p>
            <GlobalBudgetCard budget={globalBudget} />
          </div>

          {/* ── Team Budget Cards Grid ── */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Team Budgets</p>
            <div className={styles.teamGrid}>
              {teamBudgets.map((team) => (
                <TeamBudgetCard
                  key={team.id}
                  team={team}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Budget edit modal — shown when a team's Edit button is clicked */}
      {editingTeam && (
        <BudgetEditModal
          team={editingTeam}
          onSave={handleSave}
          onClose={() => setEditingTeam(null)}
        />
      )}
    </div>
  );
}
