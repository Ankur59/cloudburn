'use client'

import styles from './AIInsights.module.css'

export default function AIInsights() {
  const insights = [
    {
      title: 'EC2 Rightsizing Opportunity',
      savings: '$3,200',
      period: '/month',
      confidence: 87,
      borderColor: 'var(--info)',
    },
    {
      title: 'Unused S3 Buckets Detected',
      savings: '$890',
      period: '/month',
      confidence: 92,
      borderColor: 'var(--success)',
    },
  ]

  return (
    <div className={styles.aiInsights}>
      <h3 className={styles.sectionTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        AI Insights
      </h3>
      <div className={styles.insightsGrid}>
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={styles.insightCard}
            style={{ borderLeftColor: insight.borderColor }}
          >
            <div className={styles.cardContent}>
              <h4 className={styles.insightTitle}>{insight.title}</h4>
              <div className={styles.savingsRow}>
                <span className={styles.savingsLabel}>Estimated savings</span>
                <span className={styles.savingsValue}>
                  {insight.savings}
                  <span className={styles.period}>{insight.period}</span>
                </span>
              </div>
              <div className={styles.confidenceRow}>
                <span className={styles.confidenceLabel}>Confidence</span>
                <span className={styles.confidenceValue}>{insight.confidence}%</span>
              </div>
            </div>
            <button className={styles.reviewBtn}>Review</button>
          </div>
        ))}
      </div>
    </div>
  )
}
