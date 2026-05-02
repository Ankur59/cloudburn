import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import styles from './MonthlyTrend.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isCurrentMonth = payload[0]?.payload?.isCurrent
    return (
      <div className={styles.tooltip}>
        <p className={styles.ttLabel}>{label}</p>
        <p className={styles.ttValue}>
          ${Number(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        {isCurrentMonth && <p className={styles.ttNote}>Current month (MTD)</p>}
      </div>
    )
  }
  return null
}

export default function MonthlyTrend({ data = [], monthComparison = {} }) {
  const thisMonth = monthComparison?.thisMonthTotal ?? 0
  const lastMonth = monthComparison?.lastMonthTotal ?? 0
  const delta = monthComparison?.delta ?? 0
  const changePercent = monthComparison?.changePercent ?? 0
  const isUp = delta >= 0

  // Mark the last item as current month
  const chartData = data.map((d, i) => ({ ...d, isCurrent: i === data.length - 1 }))
  const maxCost = Math.max(...chartData.map((d) => d.cost), 0.01)

  return (
    <div className={styles.card}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Monthly Spend Trend</h3>
          <p className={styles.subtitle}>Last 12 months · AmortizedCost</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.thisMonth}>
            ${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className={`${styles.deltaBadge} ${isUp ? styles.up : styles.down}`}>
            {isUp ? '▲' : '▼'} {Math.abs(changePercent)}%
            <span className={styles.deltaLabel}> vs last month</span>
          </span>
        </div>
      </div>

      {/* ── Chart ── */}
      {chartData.length === 0 ? (
        <div className={styles.empty}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p>No monthly data. Sync AWS billing first.</p>
        </div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B7FD4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c5cbf" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="barGradCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38d9a9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4caf83" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }} />
              <Bar dataKey="cost" radius={[5, 5, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isCurrent ? 'url(#barGradCurrent)' : 'url(#barGrad)'}
                    opacity={entry.isCurrent ? 1 : 0.7 + (index / chartData.length) * 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Last month vs This month comparison ── */}
      <div className={styles.compareRow}>
        <div className={styles.compareItem}>
          <span className={styles.compareLabel}>Last Month</span>
          <span className={styles.compareValue}>
            ${lastMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <div className={styles.compareMiniBar}>
            <div className={styles.compareFillLast} style={{ width: `${lastMonth > 0 ? Math.min(100, (lastMonth / Math.max(lastMonth, thisMonth)) * 100) : 0}%` }} />
          </div>
        </div>
        <div className={`${styles.compareArrow} ${isUp ? styles.up : styles.down}`}>
          {isUp ? '→' : '←'}
        </div>
        <div className={styles.compareItem}>
          <span className={styles.compareLabel}>This Month (MTD)</span>
          <span className={`${styles.compareValue} ${styles.current}`}>
            ${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <div className={styles.compareMiniBar}>
            <div className={styles.compareFillThis} style={{ width: `${thisMonth > 0 ? Math.min(100, (thisMonth / Math.max(lastMonth, thisMonth)) * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      {/* ── Service comparison table ── */}
      {(monthComparison?.byService || []).length > 0 && (
        <div className={styles.serviceSection}>
          <p className={styles.serviceSectionTitle}>By Service — This vs Last Month</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Last</th>
                  <th>This</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {(monthComparison.byService || []).map((s, i) => (
                  <tr key={i}>
                    <td className={styles.svcName}>{s.service}</td>
                    <td className={styles.mono}>${s.lastMonthCost?.toFixed(2)}</td>
                    <td className={styles.mono}>${s.thisMonthCost?.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.deltaChip} ${s.delta >= 0 ? styles.up : styles.down}`}>
                        {s.delta >= 0 ? '+' : ''}{s.delta?.toFixed(2)}
                        {s.changePercent != null && ` (${s.changePercent}%)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
