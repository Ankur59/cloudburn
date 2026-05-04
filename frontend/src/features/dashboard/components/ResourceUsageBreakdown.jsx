import React from 'react';
import styles from './CostByService.module.css'; // Re-use styles for consistency

export default function ResourceUsageBreakdown({ usage = [] }) {
  return (
    <div className={styles.costCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>Resource Utilization</h3>
        <span className={styles.badge}>{usage.length} services tracked</span>
      </div>
      
      {usage.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
          No usage metrics collected yet.
        </p>
      ) : (
        <div className={styles.serviceList}>
          {usage.map((item, index) => {
            // Find CPU metric if it exists
            const cpuMetric = item.metrics.find(m => m.name.includes('CPU'));
            const utilValue = cpuMetric ? cpuMetric.value : null;
            
            return (
              <div key={index} className={styles.serviceItem}>
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceLeft}>
                    <span className={styles.serviceName}>{item.service}</span>
                    <span className={styles.serviceRank} style={{ marginLeft: '8px', fontSize: '10px' }}>
                      {item.totalResources} active resources
                    </span>
                  </div>
                  <div className={styles.serviceRight}>
                    {utilValue !== null && (
                      <span className={styles.serviceCost} style={{ color: utilValue > 70 ? 'var(--danger)' : 'var(--success)' }}>
                        {utilValue}% CPU
                      </span>
                    )}
                  </div>
                </div>
                
                {utilValue !== null && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ 
                        width: `${utilValue}%`, 
                        background: utilValue > 80 ? 'var(--danger)' : utilValue > 50 ? 'var(--warning)' : 'var(--success)' 
                      }}
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {item.metrics.filter(m => !m.name.includes('CPU')).map((m, idx) => (
                    <span key={idx} style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {m.name}: {m.value}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
        Note: Metrics aggregated from the last 24 hours of resource snapshots.
      </div>
    </div>
  );
}
