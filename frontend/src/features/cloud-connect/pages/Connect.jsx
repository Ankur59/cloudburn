import React, { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import Stepper from '../components/Stepper';
import ProviderSelection from '../components/ProviderSelection';
import CredentialsForm from '../components/CredentialsForm';
import ValidationStatus from '../components/ValidationStatus';
import styles from './Connect.module.css';




const Connect = () => {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('aws'); // default aws
  const [credentials, setCredentials] = useState({ accessKey: '', secretKey: '' });
  const [validationStatus, setValidationStatus] = useState('idle'); // idle, loading, success, error

  // Simulate validation
  useEffect(() => {
    if (step === 3 && validationStatus === 'idle') {
      setValidationStatus('loading');
      
      // Simulate API call
      const timer = setTimeout(() => {
        // Simple mock: if both fields have more than 5 chars, succeed, else fail
        if (credentials.accessKey.length > 5 && credentials.secretKey.length > 5) {
          setValidationStatus('success');
        } else {
          setValidationStatus('error');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [step, validationStatus, credentials]);



  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };



  const handleBack = () => {
    if (step > 1) {
      if (step === 3) {
         setValidationStatus('idle'); // reset validation when going back
      }
      setStep(step - 1);
    }
  };



  const handleProviderSelect = (selected) => {
    setProvider(selected);
  };



  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({...prev, [field]: value}));
  };




  const handleRetry = () => {
    setStep(2);
    setValidationStatus('idle');
  };




  return (
    <div className={styles.container}>
      {/* Header */}

      <div className={styles.logoContainer}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="white" stroke-width="2"></circle><path d="M10 16C10 13 12 10 16 10C20 10 22 13 22 16" stroke="white" stroke-width="2" stroke-linecap="round"></path><circle cx="16" cy="20" r="2" fill="white"></circle></svg>
      <div className={styles.logoText}>Cloudburn</div>
      </div>


      <Stepper currentStep={step} />

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.mainCard}>
          <div className={styles.cardInner}>
            {step === 1 && (
              <ProviderSelection 
                selectedProvider={provider} 
                onSelect={handleProviderSelect} 
              />
            )}

            {step === 2 && (
              <CredentialsForm 
                provider={provider}
                credentials={credentials} 
                onChange={handleCredentialChange} 
              />
            )}

            {step === 3 && (
              <ValidationStatus 
                status={validationStatus} 
                onRetry={handleRetry} 
              />
            )}
          </div>
        </div>




        {/* Actions Footer */}
        <div className={`${styles.actions} ${step === 1 ? styles.right : ''}`}>
          {step > 1 && validationStatus !== 'success' && (
             <button className={styles.btnBack} onClick={handleBack}>Back</button>
          )}
          
          {step === 1 && (
            <button className={styles.btnNext} onClick={handleNext}>Continue</button>
          )}
          
          {step === 2 && (
            <button 
              className={`${styles.btnNext} ${(!credentials.accessKey || !credentials.secretKey) ? styles.btnDisabled : ''}`} 
              onClick={handleNext}
              disabled={!credentials.accessKey || !credentials.secretKey}
            >
              Connect
            </button>
          )}

          {step === 3 && validationStatus === 'success' && (
            <button className={styles.btnNext} onClick={() => alert('Navigate to dashboard')}>Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connect;
