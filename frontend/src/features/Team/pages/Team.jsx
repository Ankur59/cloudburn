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
import { getTeamsApi, createTeamApi } from '../team.api';

// ─── Team Page ────────────────────────────────────────────────────────────────
export default function Team() {
  const dispatch = useDispatch();
  const { teams } = useSelector((state) => state.team);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentOrg, setCurrentOrg]   = useState('Acme Corporation');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await getTeamsApi();
        const apiTeams = res.data?.data?.teams || [];
        
        if (apiTeams.length === 0) {
          dispatch(setTeams([]));
          setSelectedTeamId(null);
        } else {
          const formattedTeams = apiTeams.map(t => ({
            ...t,
            id: t._id,
            members: t.members || [],
            memberCount: (t.members || []).length,
            provider: t.provider || 'AWS',
            trend: t.trend || 0,
            totalSpend: `$${(t.currentSpend || 0).toLocaleString()}`,
          }));
          dispatch(setTeams(formattedTeams));
          if (!selectedTeamId) {
            setSelectedTeamId(formattedTeams[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        dispatch(setTeams([]));
        setSelectedTeamId(null);
      }
    };
    
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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

  const handleCreateTeam = async (teamData) => {
    try {
      const res = await createTeamApi(teamData);
      const newTeam = res.data?.data?.team;
      if (newTeam) {
        const formattedTeam = {
          ...newTeam,
          id: newTeam._id,
          members: [],
          memberCount: 0,
          provider: 'AWS',
          trend: 0,
          totalSpend: `$0`
        };
        dispatch(addTeam(formattedTeam));
        setSelectedTeamId(formattedTeam.id);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error("Failed to create team:", err);
      alert("Failed to create team. Ensure you are an Admin.");
    }
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

      {/* Main content area */}
      <div className={`${styles.main} ${sidebarCollapsed ? styles.expanded : ''}`}>
        {/* Top bar */}
        <Header
          currentOrg={currentOrg}
          organizations={organizations}
          onOrgChange={setCurrentOrg}
          onMenuClick={() => setMobileSidebarOpen(true)}
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
