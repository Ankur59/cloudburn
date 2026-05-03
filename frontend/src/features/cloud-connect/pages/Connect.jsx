import React, { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import Stepper from '../components/Stepper';
import ProviderSelection from '../components/ProviderSelection';
import CredentialsForm from '../components/CredentialsForm';
import ValidationStatus from '../components/ValidationStatus';
import useCloudConnect from '../hook/useCloudConnect';
import { useNavigate } from 'react-router-dom';
import styles from './Connect.module.css';

const Connect = () => {
  const navigate = useNavigate();
  const { handleConnectAws } = useCloudConnect();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('aws'); // default aws
  const [credentials, setCredentials] = useState({ accessKey: '', secretKey: '' });
  const [validationStatus, setValidationStatus] = useState('idle'); // idle, loading, success, error

  // Trigger validation when reaching step 3
  useEffect(() => {
    let isMounted = true;

    const performValidation = async () => {
      if (step === 3 && validationStatus === 'idle') {
        setValidationStatus('loading');
        
        const result = await handleConnectAws(credentials);
        
        if (!isMounted) return;
        
        if (result.success) {
          setValidationStatus('success');
        } else {
          // We can optionally pass result.message to the ValidationStatus component
          // For now, setting 'error' triggers the UI state
          setValidationStatus('error');
        }
      }
    };

    performValidation();

    return () => {
      isMounted = false;
    };
  }, [step, validationStatus, credentials, handleConnectAws]);



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
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2"></circle><path d="M10 16C10 13 12 10 16 10C20 10 22 13 22 16" stroke="white" strokeWidth="2" strokeLinecap="round"></path><circle cx="16" cy="20" r="2" fill="white"></circle></svg>
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
            <button className={styles.btnNext} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connect;
