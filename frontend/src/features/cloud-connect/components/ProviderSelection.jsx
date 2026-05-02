import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './ProviderSelection.module.css';

const ProviderSelection = ({ selectedProvider, onSelect }) => {
  return (
    <>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Connect Your Cloud Provider</h2>
        <p className={styles.cardSubtitle}>Select a cloud provider to connect to CloudCost</p>
      </div>

      <div className={styles.providerGrid}>
        {/* AWS */}
        <div 
          className={`${styles.providerCard} ${selectedProvider === 'aws' ? styles.selected : (selectedProvider ? styles.unselected : '')}`}
          onClick={() => onSelect('aws')}
        >
          {selectedProvider === 'aws' && (
            <div className={styles.checkIconWrapper}>
              <CheckCircle size={18} fill="var(--text-primary)" color="var(--page-base)" />
            </div>
          )}
          <div className={styles.providerIcon}>
            <svg width="48" height="32" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.7 12.3C22.7 12.3 20.3 8.1 14.5 8.1C8.7 8.1 6.3 12.3 6.3 12.3" stroke="#F8991D" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M19.1 14.4C19.1 14.4 17.5 15.9 14.5 15.9C11.5 15.9 9.9 14.4 9.9 14.4" stroke="#F8991D" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M26.4 12.3L28.1 15.6L31.7 15.1" stroke="#F8991D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={styles.providerName}>Amazon Web Services</span>
          <span className={styles.providerBadge}>POWERED BY AMAZON</span>
        </div>

        {/* GCP */}
        <div 
          className={`${styles.providerCard} ${selectedProvider === 'gcp' ? styles.selected : (selectedProvider ? styles.unselected : '')}`}
          onClick={() => onSelect('gcp')}
        >
          {selectedProvider === 'gcp' && (
            <div className={styles.checkIconWrapper}>
              <CheckCircle size={18} fill="var(--text-primary)" color="var(--page-base)" />
            </div>
          )}
          <div className={styles.providerIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#4285F4" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="4" stroke="#EA4335" strokeWidth="2"/>
            </svg>
          </div>
          <span className={styles.providerName}>Google Cloud Platform</span>
          <span className={styles.providerBadgeMuted}>POWERED BY GOOGLE</span>
        </div>

        {/* Azure */}
        <div 
          className={`${styles.providerCard} ${selectedProvider === 'azure' ? styles.selected : (selectedProvider ? styles.unselected : '')}`}
          onClick={() => onSelect('azure')}
        >
          {selectedProvider === 'azure' && (
            <div className={styles.checkIconWrapper}>
              <CheckCircle size={18} fill="var(--text-primary)" color="var(--page-base)" />
            </div>
          )}
          <div className={styles.providerIcon}>
            <span style={{color: '#0078D4', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', lineHeight: 1}}>A</span>
          </div>
          <span className={styles.providerName}>Microsoft Azure</span>
          <span className={styles.providerBadgeMuted}>POWERED BY MICROSOFT</span>
        </div>
      </div>
    </>
  );
};

export default ProviderSelection;
