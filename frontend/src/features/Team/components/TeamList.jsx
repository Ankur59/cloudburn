import styles from './TeamList.module.css';

/**
 * TeamList — Left panel
 *
 * Shows all teams as clickable rows. Clicking a row selects it
 * and shows the team detail on the right.
 *
 * Props:
 *  - teams: array of team objects
 *  - selectedId: id of the currently selected team
 *  - onSelect: (teamId) => void
 *  - onCreateTeam: () => void
 */
export default function TeamList({ teams, selectedId, onSelect, onCreateTeam }) {
  return (
    <div className={styles.panel}>
      {/* Header row */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Teams</span>
        <button id="create-team-btn" className={styles.createBtn} onClick={onCreateTeam}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Team
        </button>
      </div>

      {/* Team rows */}
      {teams.map((team) => (
        <div
          key={team.id}
          id={`team-row-${team.id}`}
          className={`${styles.teamRow} ${selectedId === team.id ? styles.active : ''}`}
          onClick={() => onSelect(team.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(team.id)}
        >
          {/* Top line: name + monthly spend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.teamName}>{team.name}</span>
            <span className={styles.teamSpend}>{team.totalSpend}</span>
          </div>

          {/* Bottom line: member count + cloud provider */}
          <div className={styles.teamMeta}>
            <span className={styles.teamStat}>{team.memberCount} members</span>
            <span className={`${styles.providerBadge} ${styles[team.provider.toLowerCase()]}`}>
              {team.provider}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
