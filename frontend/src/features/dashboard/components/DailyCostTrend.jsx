import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import styles from "./DailyCostTrend.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className={styles.tooltipItem}
            style={{ color: entry.color }}
          >
            <span className={styles.tooltipName}>{entry.name}:</span>
            <span className={styles.tooltipValue}>
              ${Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DailyCostTrend({ data = [] }) {
  // Normalize: API sends aws as { cost, credits, netCost }; chart uses flat numbers
  const chartData = data.map((d) => ({
    date: d.date,
    aws: typeof d.aws === "object" ? (d.aws.cost ?? d.aws.grossCost ?? 0) : (d.aws ?? 0),
  }));

  const hasData = chartData.some((d) => d.aws > 0);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3>Daily Cost Trend</h3>
          <p className={styles.chartSubtitle}>
            {data.length > 30 ? 'Last 90 days' : 'Last 30 days'} · AWS AmortizedCost
          </p>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendDot} style={{ backgroundColor: '#5B7FD4' }} />
          <span className={styles.legendLabel}>AWS</span>
        </div>
      </div>
      <div className={styles.chartContainer}>
        {!hasData ? (
          <div className={styles.emptyState}>
            <p>No daily cost data available. Sync AWS billing to populate this chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B7FD4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5B7FD4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                interval="preserveStartEnd"
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                tickFormatter={(value) => `$${value % 1 === 0 ? value : value.toFixed(2)}`}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="aws"
                name="AWS"
                stroke="#5B7FD4"
                strokeWidth={2}
                fill="url(#awsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#5B7FD4", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
