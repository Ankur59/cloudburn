import React from 'react';
import { Check, X } from 'lucide-react';
import styles from './ValidationStatus.module.css';

const ValidationStatus = ({ status, onRetry }) => {
  return (
    <div className={styles.validationState}>
      {status === 'loading' && (
        <>
          <div className={styles.loaderContainer}>
            <div className={styles.pulseLoader}></div>
          </div>
          <h2 className={styles.validationTitle}>Verifying credentials...</h2>
          <p className={styles.validationSubtitle}>This usually takes a few seconds</p>
        </>
      )}
      
      {status === 'success' && (
        <div className={styles.fadeIn}>
          <div className={styles.successIcon}>
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className={styles.validationTitle}>Connected to AWS</h2>
          <div className={styles.servicesFound}>
            <span className={styles.highlight}>6 services</span> found
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.fadeIn}>
          <div className={styles.errorIcon}>
            <X size={40} strokeWidth={3} />
          </div>
          <h2 className={styles.validationTitle}>Connection Failed</h2>
          <p className={styles.validationMessage}>
            Invalid credentials. Please check your access key and secret key are correct and have read-only permissions.
          </p>
          <button className={styles.retryButton} onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default ValidationStatus;
