import styles from './TeamDetail.module.css';

/**
 * RoleBadge — small helper to render the correct role pill
 *
 * Props:
 *  - role: 'Org Admin' | 'Team Lead' | 'Developer'
 */
function RoleBadge({ role }) {
  // Map role string → CSS module class name
  const classMap = {
    'Org Admin': styles.orgAdmin,
    'Team Lead': styles.teamLead,
    'Developer': styles.developer,
  };

  return (
    <span className={`${styles.roleBadge} ${classMap[role] || styles.developer}`}>
      {role}
    </span>
  );
}

/**
 * TeamDetail — Right panel
 *
 * Shows the selected team's cost summary and member table.
 *
 * Props:
 *  - team: the selected team object (see MOCK_TEAMS in Team.jsx)
 *  - onInvite: () => void — opens the invite modal
 *  - onRemoveMember: (memberId) => void
 */
export default function TeamDetail({ team, onInvite, onRemoveMember }) {
  // Split members into active and pending
  const activeMembers = team.members.filter((m) => m.status === 'active');
  const pendingMembers = team.members.filter((m) => m.status === 'pending');
  const allRows = [...activeMembers, ...pendingMembers];

  return (
    <div className={styles.panel}>
      {/* ── Cost Summary Card ── */}
      <div className={styles.costCard}>
        <div>
          <p className={styles.costLabel}>Monthly Spend</p>
          <p className={styles.costValue}>{team.totalSpend}</p>
        </div>

        <div className={styles.costStats}>
          <div className={styles.costStat}>
            <span className={styles.costStatLabel}>vs Last Month</span>
            <span className={`${styles.costStatValue} ${team.trend > 0 ? styles.up : styles.down}`}>
              {team.trend > 0 ? '+' : ''}{team.trend}%
            </span>
          </div>
          <div className={styles.costStat}>
            <span className={styles.costStatLabel}>Cloud</span>
            <span className={styles.costStatValue}>{team.provider}</span>
          </div>
          <div className={styles.costStat}>
            <span className={styles.costStatLabel}>Members</span>
            <span className={styles.costStatValue}>{team.memberCount}</span>
          </div>
        </div>
      </div>

      {/* ── Members Card ── */}
      <div className={styles.membersCard}>
        <div className={styles.membersHeader}>
          <span className={styles.membersTitle}>Members</span>
          <button id="invite-member-btn" className={styles.inviteBtn} onClick={onInvite}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Invite Member
          </button>
        </div>

        {/* Empty state */}
        {allRows.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className={styles.emptyTitle}>No members yet</p>
            <p className={styles.emptySubtitle}>Invite your team to get started</p>
          </div>
        ) : (
          /* Member table */
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {allRows.map((member) => {
                const isPending = member.status === 'pending';

                return (
                  <tr
                    key={member.id}
                    id={`member-row-${member.id}`}
                    className={isPending ? styles.pendingRow : ''}
                  >
                    {/* Name + avatar */}
                    <td>
                      <div className={styles.memberName}>
                        <div className={styles.avatar}>
                          {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className={styles.nameText}>{member.name}</span>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td>
                      {isPending ? (
                        <span className={styles.pendingBadge}>Pending</span>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </td>

                    {/* Email */}
                    <td>{member.email}</td>

                    {/* Joined date */}
                    <td>{isPending ? '—' : member.joined}</td>

                    {/* Remove button (not for pending) */}
                    <td>
                      {!isPending && (
                        <button
                          id={`remove-member-${member.id}`}
                          className={styles.removeBtn}
                          onClick={() => onRemoveMember(member.id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
