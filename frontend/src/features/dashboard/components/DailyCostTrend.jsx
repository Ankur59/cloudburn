'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import styles from './DailyCostTrend.module.css'

// Generate 30 days of data
function generateData() {
  const data = []
  const startDate = new Date(2024, 3, 1) // April 1
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    // Generate realistic looking cost data with some variation
    const awsBase = 1600 + Math.sin(i * 0.3) * 200
    const gcpBase = 900 + Math.cos(i * 0.25) * 150
    const azureBase = 500 + Math.sin(i * 0.4) * 100
    
    data.push({
      date: `Apr ${i + 1}`,
      aws: Math.round(awsBase + Math.random() * 300),
      gcp: Math.round(gcpBase + Math.random() * 200),
      azure: Math.round(azureBase + Math.random() * 150),
    })
  }
  return data
}

const data = generateData()

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={styles.tooltipItem} style={{ color: entry.color }}>
            <span className={styles.tooltipName}>{entry.name}:</span>
            <span className={styles.tooltipValue}>${entry.value.toLocaleString()}</span>
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

export default function DailyCostTrend() {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3>Daily Cost Trend</h3>
        <CustomLegend />
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              width={50}
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
