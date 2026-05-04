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

function getStatus(pct, threshold) {
  if (pct >= 100) return 'danger';
  if (pct >= threshold) return 'warning';
  return 'healthy';
}

const STATUS_LABEL = {
  healthy: 'Healthy',
  warning: 'Approaching Limit',
  danger: 'Over Budget',
};

/**
 * TeamDetail — Right panel
 */
export default function TeamDetail({ team, onInvite, onRemoveMember }) {
  const activeMembers = team.members.filter((m) => m.status === 'active');
  const pendingMembers = (team.members || []).filter((m) => m.status === 'pending');
  const allRows = [...activeMembers, ...pendingMembers];

  const budget = team.budgetLimit || 0;
  const spent = team.currentSpend || 0;
  const threshold = team.alertThreshold || 80;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const barPct = Math.min(pct, 100);
  const status = getStatus(pct, threshold);

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

      {/* ── Budget Tracking Card ── */}
      <div className={styles.budgetCard}>
        <div className={styles.budgetHeader}>
          <span className={styles.budgetTitle}>Monthly Budget Tracking</span>
          <span className={`${styles.statusBadge} ${styles[status]}`}>
            <span className={`${styles.statusDot} ${styles[status]}`} />
            {STATUS_LABEL[status]}
          </span>
        </div>
        
        <div className={styles.budgetNumbers}>
          <span className={styles.currentSpend}>${spent.toLocaleString()}</span>
          <span className={styles.budgetLimit}>/ ${budget.toLocaleString()}</span>
        </div>

        <div className={styles.progressTrack}>
          <div 
            className={`${styles.progressFill} ${styles[status]}`} 
            style={{ width: `${barPct}%` }}
          />
        </div>

        <div className={styles.budgetMeta}>
          <span>{pct}% of monthly limit used</span>
          <span>Alert threshold set at {threshold}%</span>
        </div>
      </div>

      {/* ── Resource Tagging Card ── */}
      <div className={styles.tagCard}>
        <div className={styles.tagHeader}>
          <div className={styles.tagTitleGroup}>
            <span className={styles.tagTitle}>Resource Tagging</span>
            <p className={styles.tagDescription}>Use these tags in AWS to track this team's spend</p>
          </div>
          <div className={styles.tagBadge}>AWS Active</div>
        </div>
        <div className={styles.tagBox}>
          <div className={styles.tagField}>
            <span className={styles.tagLabel}>Tag Key</span>
            <code className={styles.tagValue}>Team</code>
          </div>
          <div className={styles.tagSeparator}>:</div>
          <div className={styles.tagField}>
            <span className={styles.tagLabel}>Tag Value</span>
            <code className={styles.tagValue}>{team.teamKey || 'platform-engineering'}</code>
          </div>
        </div>
        <div className={styles.tagNote}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Tag your resources with this key and wait for 24hr for start sync process</span>
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
