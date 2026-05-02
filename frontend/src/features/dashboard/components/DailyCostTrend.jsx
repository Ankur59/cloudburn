import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts'
import styles from './DailyCostTrend.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={styles.tooltipItem} style={{ color: entry.color }}>
            <span className={styles.tooltipName}>{entry.name}:</span>
            <span className={styles.tooltipValue}>${Number(entry.value).toFixed(6)}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CustomLegend = () => {
  const items = [
    { name: 'AWS', color: '#5B7FD4' },
    { name: 'GCP', color: '#4DB87A' },
    { name: 'Azure', color: '#C9882A' },
  ]
  
  return (
    <div className={styles.legend}>
      {items.map((item) => (
        <div key={item.name} className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
          <span className={styles.legendLabel}>{item.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function DailyCostTrend({ data = [] }) {
  // Normalize: API sends aws as { cost, credits, grossCost }; chart uses flat numbers
  const chartData = data.map((d) => ({
    date: d.date,
    aws: typeof d.aws === 'object' ? (d.aws.grossCost ?? 0) : (d.aws ?? 0),
    gcp: d.gcp ?? 0,
    azure: d.azure ?? 0,
  }))

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3>Daily Cost Trend</h3>
        <CustomLegend />
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#555555', fontSize: 12 }}
              interval="preserveStartEnd"
              tickMargin={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#555555', fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(4)}`}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="aws" 
              name="AWS"
              stroke="#5B7FD4" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#5B7FD4' }}
            />
            <Line 
              type="monotone" 
              dataKey="gcp" 
              name="GCP"
              stroke="#4DB87A" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#4DB87A' }}
            />
            <Line 
              type="monotone" 
              dataKey="azure" 
              name="Azure"
              stroke="#C9882A" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#C9882A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
