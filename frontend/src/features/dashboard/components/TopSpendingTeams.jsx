import styles from './TopSpendingTeams.module.css'

const statusLabels = {
  'at-risk': 'At Risk',
  'on-track': 'On Track',
  'over-budget': 'Over Budget',
}

export default function TopSpendingTeams({ teams = [] }) {
  return (
    <div className={styles.teamsCard}>
      <h3 className={styles.title}>Top Spending Teams</h3>
      {teams.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
          No team spending data available.
        </p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Team</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index}>
                  <td className={styles.teamName}>{team.name}</td>
                  <td className={styles.money}>${team.budget?.toLocaleString?.() ?? '-'}</td>
                  <td className={styles.money}>${team.spent?.toLocaleString?.() ?? '-'}</td>
                  <td className={styles.money}>${team.remaining?.toLocaleString?.() ?? '-'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[team.status]}`}>
                      {statusLabels[team.status] ?? team.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
