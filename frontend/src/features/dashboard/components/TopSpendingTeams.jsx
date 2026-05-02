import { useState } from 'react'
import styles from './TopSpendingTeams.module.css'

const statusLabels = {
  'at-risk': 'At Risk',
  'on-track': 'On Track',
  'over-budget': 'Over Budget',
}

const instanceStateColor = (state) => {
  if (!state) return '#888'
  const s = state.toLowerCase()
  if (s.includes('running')) return '#4caf83'
  if (s.includes('stopped')) return '#e05252'
  return '#f59e0b'
}

export default function TopSpendingTeams({ teams = [] }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className={styles.teamsCard}>
      <h3 className={styles.title}>Team Breakdown</h3>
      {teams.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
          No team spending data available.
        </p>
      ) : (
        <div className={styles.teamList}>
          {teams.map((team, index) => {
            const isOpen = expanded === index
            const pct = team.budget > 0 ? Math.min(100, Math.round((team.spent / team.budget) * 100)) : 0

            return (
              <div key={index} className={`${styles.teamItem} ${isOpen ? styles.open : ''}`}>
                {/* Team row header — clickable */}
                <button
                  className={styles.teamRow}
                  onClick={() => setExpanded(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.teamLeft}>
                    <span className={styles.teamAvatar}>{team.name?.[0]?.toUpperCase()}</span>
                    <div className={styles.teamNameWrap}>
                      <span className={styles.teamName}>{team.name}</span>
                      <span className={`${styles.statusBadge} ${styles[team.status]}`}>
                        {statusLabels[team.status] ?? team.status}
                      </span>
                    </div>
                  </div>
                  <div className={styles.teamRight}>
                    <div className={styles.spendInfo}>
                      <span className={styles.spent}>${team.spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span className={styles.budget}>/ ${team.budget?.toLocaleString('en-US')}</span>
                    </div>
                    <div className={styles.miniBar}>
                      <div className={`${styles.miniBarFill} ${styles[team.status]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className={styles.detail}>
                    {/* Services */}
                    {(team.services || []).length > 0 && (
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>AWS Services</p>
                        <table className={styles.detailTable}>
                          <thead>
                            <tr>
                              <th>Service</th>
                              <th>Cost</th>
                              <th>Usage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.services.map((svc, si) => (
                              <tr key={si}>
                                <td className={styles.svcName}>{svc.service}</td>
                                <td className={styles.mono}>${svc.cost?.toFixed(4)}</td>
                                <td className={styles.mono}>{svc.usageQty?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* EC2 Instances */}
                    {(team.instances || []).length > 0 && (
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>EC2 Instances</p>
                        <div className={styles.instanceGrid}>
                          {team.instances.map((inst, ii) => (
                            <div key={ii} className={styles.instanceChip}>
                              <span
                                className={styles.instanceDot}
                                style={{ backgroundColor: instanceStateColor(inst.state) }}
                              />
                              <div className={styles.instanceInfo}>
                                <span className={styles.instanceName}>
                                  {inst.instanceName || inst.instanceType}
                                </span>
                                <span className={styles.instanceMeta}>
                                  {inst.instanceType} · {inst.az !== 'unknown' ? inst.az : 'AZ unknown'}
                                </span>
                                <span className={styles.instanceMeta}>
                                  ${inst.cost?.toFixed(4)} · {inst.usageHours}h
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
