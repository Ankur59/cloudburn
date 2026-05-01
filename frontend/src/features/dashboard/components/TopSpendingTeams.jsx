'use client'

import styles from './TopSpendingTeams.module.css'

const teams = [
  {
    name: 'Platform Engineering',
    budget: 50000,
    spent: 42150,
    remaining: 7850,
    status: 'at-risk',
  },
  {
    name: 'Data Science',
    budget: 35000,
    spent: 28400,
    remaining: 6600,
    status: 'on-track',
  },
  {
    name: 'Backend Services',
    budget: 30000,
    spent: 18750,
    remaining: 11250,
    status: 'on-track',
  },
  {
    name: 'Frontend Apps',
    budget: 15000,
    spent: 14200,
    remaining: 800,
    status: 'over-budget',
  },
  {
    name: 'DevOps',
    budget: 20000,
    spent: 12890,
    remaining: 7110,
    status: 'on-track',
  },
]

const statusLabels = {
  'at-risk': 'At Risk',
  'on-track': 'On Track',
  'over-budget': 'Over Budget',
}

export default function TopSpendingTeams() {
  return (
    <div className={styles.teamsCard}>
      <h3 className={styles.title}>Top Spending Teams</h3>
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
                <td className={styles.money}>${team.budget.toLocaleString()}</td>
                <td className={styles.money}>${team.spent.toLocaleString()}</td>
                <td className={styles.money}>${team.remaining.toLocaleString()}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[team.status]}`}>
                    {statusLabels[team.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
