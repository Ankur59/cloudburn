import { useState } from 'react';
import styles from './InsightCard.module.css';

/**
 * InsightCard
 *
 * A single AI insight card. Collapsed by default (title + metrics only).
 * Click anywhere on the card to expand the full explanation + action buttons.
 *
 * Props:
 *  - insight: insight data object (see MOCK_INSIGHTS in Aiinsights.jsx)
 *  - onAction: (insightId, action) => void
 *    action can be 'apply' | 'review' | 'dismiss'
 */
export default function InsightCard({ insight, onAction }) {
  const [expanded, setExpanded] = useState(false);

  const {
    id, title, service, explanation, savings,
    confidence, priority, isNew, actionLabel,
  } = insight;

  return (
    <div
      id={`insight-card-${id}`}
      className={`
        ${styles.card}
        ${isNew ? styles.isNew : ''}
        ${expanded ? styles.expanded : ''}
      `}
    >
      {/* ── Collapsed Header (always visible) ── */}
      <div
        className={styles.header}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((prev) => !prev)}
      >
        <div className={styles.headerLeft}>
          {/* Title row: title + "New" badge */}
          <div className={styles.titleRow}>
            <span className={styles.title}>{title}</span>
            {isNew && <span className={styles.newBadge}>New</span>}
          </div>

          {/* Service tag */}
          <span className={styles.serviceTag}>{service}</span>
        </div>

        {/* Chevron */}
        <span className={`${styles.chevron} ${expanded ? styles.open : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {/* ── Metrics Row (always visible) ── */}
      <div className={styles.metricsRow} onClick={() => setExpanded((prev) => !prev)}>
        {/* Savings */}
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Est. Savings</span>
          <span className={`${styles.metricValue} ${styles.savings}`}>{savings}</span>
        </div>

        <div className={styles.metricDivider} />

        {/* Confidence */}
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Confidence</span>
          <span className={styles.metricValue}>{confidence}%</span>
        </div>

        <div className={styles.metricDivider} />

        {/* Priority badge */}
        <span className={`${styles.priorityBadge} ${styles[priority]}`}>
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className={styles.body}>
          {/* Plain-English explanation */}
          <p className={styles.explanation}>{explanation}</p>

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* Primary action */}
            <button
              id={`insight-action-${id}`}
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={(e) => { e.stopPropagation(); onAction(id, 'apply'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {actionLabel}
            </button>

            {/* Review Resource */}
            <button
              id={`insight-review-${id}`}
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onAction(id, 'review'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Review Resource
            </button>

            {/* Dismiss */}
            <button
              id={`insight-dismiss-${id}`}
              className={`${styles.actionBtn} ${styles.dismiss}`}
              onClick={(e) => { e.stopPropagation(); onAction(id, 'dismiss'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
