import React, { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Info } from 'lucide-react';
import styles from './CredentialsForm.module.css';

const CredentialsForm = ({ provider, credentials, onChange }) => {
  const [showSecret, setShowSecret] = useState(false);

  const providerNames = {
    aws: 'AWS',
    gcp: 'GCP',
    azure: 'Azure'
  };

  const currentProviderName = providerNames[provider] || 'AWS';

  return (
    <>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Enter {currentProviderName} Credentials</h2>
        <div className={styles.subtitleWrapper}>
          <p className={styles.cardSubtitle}>Provide read-only credentials to securely connect your account</p>
          <div className={styles.infoTooltip} title="We need read-only access to analyze your billing data without permission to modify your resources.">
            <Info size={14} />
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Access Key ID</label>
          <div className={styles.inputWrapper}>
            <input 
              type="text" 
              className={styles.inputField} 
              value={credentials.accessKey}
              onChange={(e) => onChange('accessKey', e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              spellCheck="false"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Secret Access Key</label>
          <div className={styles.inputWrapper}>
            <input 
              type={showSecret ? "text" : "password"} 
              className={styles.inputField} 
              value={credentials.secretKey}
              onChange={(e) => onChange('secretKey', e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              spellCheck="false"
            />
            <button 
              className={styles.eyeButton} 
              onClick={() => setShowSecret(!showSecret)}
              aria-label={showSecret ? "Hide secret key" : "Show secret key"}
              type="button"
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html" target="_blank" rel="noreferrer" className={styles.helpLink}>
          <ExternalLink size={14} />
          How to generate read-only credentials
        </a>
      </div>
    </>
  );
};

export default CredentialsForm;
