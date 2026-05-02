'use client'

import styles from './CostByService.module.css'

const services = [
  { name: 'Amazon EC2', cost: 45230, percentage: 100 },
  { name: 'Amazon RDS', cost: 28150, percentage: 62 },
  { name: 'Amazon S3', cost: 18420, percentage: 41 },
  { name: 'AWS Lambda', cost: 12890, percentage: 28 },
  { name: 'Amazon CloudFront', cost: 9650, percentage: 21 },
  { name: 'Other Services', cost: 10249, percentage: 23 },
]

export default function CostByService() {
  return (
    <div className={styles.costCard}>
      <h3 className={styles.title}>Cost by Service</h3>
      <div className={styles.serviceList}>
        {services.map((service, index) => (
          <div key={index} className={styles.serviceItem}>
            <div className={styles.serviceHeader}>
              <span className={styles.serviceName}>{service.name}</span>
              <span className={styles.serviceCost}>${service.cost.toLocaleString()}</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${service.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
