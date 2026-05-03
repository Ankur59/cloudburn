import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTeams, addPendingInvite, removeMember, addTeam } from '../team.slice';
import Sidebar from '../../shared/Sidebar';
import Header from '../../dashboard/components/Header';
import TeamList from '../components/TeamList';
import TeamDetail from '../components/TeamDetail';
import InviteModal from '../components/InviteModal';
import CreateTeamModal from '../components/CreateTeamModal';
import styles from './Team.module.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TEAMS = [
  {
    id: 'team-1',
    name: 'Platform Engineering',
    provider: 'AWS',
    memberCount: 5,
    totalSpend: '$24,840',
    currentSpend: 24840,
    budgetLimit: 30000,
    alertThreshold: 80,
    teamKey: 'platform-engineering',
    trend: 12,
    members: [
      { id: 'm-1', name: 'Alex Johnson',  role: 'Org Admin',  email: 'alex@company.com',    joined: 'Jan 12, 2025', status: 'active'  },
      { id: 'm-2', name: 'Sarah Chen',    role: 'Team Lead',  email: 'sarah@company.com',   joined: 'Feb 3, 2025',  status: 'active'  },
      { id: 'm-3', name: 'Marcus Rivera', role: 'Developer',  email: 'marcus@company.com',  joined: 'Mar 8, 2025',  status: 'active'  },
      { id: 'm-4', name: 'Priya Sharma',  role: 'Developer',  email: 'priya@company.com',   joined: 'Apr 1, 2025',  status: 'active'  },
      { id: 'm-5', name: 'James Wu',      role: 'Developer',  email: 'james@company.com',   joined: 'Apr 15, 2025', status: 'active'  },
      { id: 'm-6', name: 'nina@startup.io',  role: 'Developer', email: 'nina@startup.io',  joined: '',             status: 'pending' },
    ],
  },
  {
    id: 'team-2',
    name: 'Data & Analytics',
    provider: 'GCP',
    memberCount: 3,
    totalSpend: '$41,200',
    currentSpend: 41200,
    budgetLimit: 40000,
    alertThreshold: 90,
    teamKey: 'data-analytics',
    trend: 28,
    members: [
      { id: 'm-7', name: 'Lena Müller',   role: 'Team Lead',  email: 'lena@company.com',    joined: 'Jan 20, 2025', status: 'active'  },
      { id: 'm-8', name: 'Omar Hassan',   role: 'Developer',  email: 'omar@company.com',    joined: 'Feb 14, 2025', status: 'active'  },
      { id: 'm-9', name: 'Yuki Tanaka',   role: 'Developer',  email: 'yuki@company.com',    joined: 'Mar 30, 2025', status: 'active'  },
      { id: 'm-10', name: 'raj@analytics.io', role: 'Developer', email: 'raj@analytics.io', joined: '', status: 'pending' },
    ],
  },
  {
    id: 'team-3',
    name: 'Frontend Products',
    provider: 'Azure',
    memberCount: 4,
    totalSpend: '$8,560',
    currentSpend: 8560,
    budgetLimit: 15000,
    alertThreshold: 75,
    teamKey: 'frontend-products',
    trend: -5,
    members: [
      { id: 'm-11', name: 'Chloe Martin',  role: 'Team Lead',  email: 'chloe@company.com',  joined: 'Dec 5, 2024',  status: 'active'  },
      { id: 'm-12', name: 'Diego Santos',  role: 'Developer',  email: 'diego@company.com',  joined: 'Jan 8, 2025',  status: 'active'  },
      { id: 'm-13', name: 'Aisha Patel',   role: 'Developer',  email: 'aisha@company.com',  joined: 'Feb 22, 2025', status: 'active'  },
      { id: 'm-14', name: 'Tom Fischer',   role: 'Developer',  email: 'tom@company.com',    joined: 'Mar 11, 2025', status: 'active'  },
    ],
  },
];

// ─── Team Page ────────────────────────────────────────────────────────────────
export default function Team() {
  const dispatch = useDispatch();
  const { teams } = useSelector((state) => state.team);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOrg, setCurrentOrg]   = useState('Acme Corporation');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (teams.length === 0) {
      dispatch(setTeams(MOCK_TEAMS));
      setSelectedTeamId(MOCK_TEAMS[0].id);
    } else if (!selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [dispatch, teams, selectedTeamId]);

  const organizations = ['Acme Corporation', 'TechStart Inc.', 'Global Dynamics'];

  // Find the currently selected team object
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Collect pending invites for the invite modal (members with status='pending')
  const pendingInvites = selectedTeam
    ? (selectedTeam.members || [])
        .filter((m) => m.status === 'pending')
        .map((m) => ({ email: m.email, role: m.role }))
    : [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendInvite = ({ email, role }) => {
    const newMember = {
      id: `m-${Date.now()}`,
      name: email,
      role,
      email,
      joined: '',
      status: 'pending',
    };
    dispatch(addPendingInvite({ teamId: selectedTeamId, member: newMember }));
  };

  const handleRemoveMember = (memberId) => {
    dispatch(removeMember({ teamId: selectedTeamId, memberId }));
  };

  const handleCreateTeam = (teamData) => {
    const id = `team-${Date.now()}`;
    dispatch(addTeam({ ...teamData, id }));
    setSelectedTeamId(id);
  };

  return (
    <div className={styles.page}>
      {/* Sidebar — shared across all pages */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        {/* Top bar */}
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
        />

        <div className={styles.content}>
          {/* Page heading */}
          <div className={styles.pageHeader}>
            <div>
              <h1>Team Management</h1>
              <p>Manage access control and cost ownership per team</p>
            </div>
          </div>

          {/* Two-column layout */}
          <div className={styles.layout}>
            {/* Left: team list */}
            <TeamList
              teams={teams}
              selectedId={selectedTeamId}
              onSelect={setSelectedTeamId}
              onCreateTeam={() => setShowCreateModal(true)}
            />

            {/* Right: team detail */}
            {selectedTeam && (
              <TeamDetail
                team={selectedTeam}
                onInvite={() => setShowInviteModal(true)}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </div>
        </div>
      </div>

      {/* Invite modal — rendered at root level so it overlays everything */}
      {showInviteModal && (
        <InviteModal
          pendingInvites={pendingInvites}
          onClose={() => setShowInviteModal(false)}
          onSendInvite={handleSendInvite}
        />
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTeam}
        />
      )}
    </div>
  );
}
