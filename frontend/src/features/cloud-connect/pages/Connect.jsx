import React, { useState, useEffect } from "react";
import { Cloud } from "lucide-react";
import Stepper from "../components/Stepper";
import ProviderSelection from "../components/ProviderSelection";
import CredentialsForm from "../components/CredentialsForm";
import ValidationStatus from "../components/ValidationStatus";
import useCloudConnect from "../hook/useCloudConnect";
import { syncAwsCostApi, syncAwsBillingApi } from "../service/cloudConnect.api";
import { useNavigate } from "react-router-dom";
import styles from "./Connect.module.css";

const Connect = () => {
  const navigate = useNavigate();
  const { handleConnectAws } = useCloudConnect();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState("aws"); // default aws
  const [credentials, setCredentials] = useState({
    accessKey: "",
    secretKey: "",
  });
  const [validationStatus, setValidationStatus] = useState("idle"); // idle, loading, success, error
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Trigger validation when reaching step 3
  useEffect(() => {
    let isMounted = true;

    const performValidation = async () => {
      if (step === 3 && validationStatus === "idle") {
        setValidationStatus("loading");

        const result = await handleConnectAws(credentials);
        console.log(result);

        if (!isMounted) return;

        if (result.success) {
          setValidationStatus("success");

          // Wait 1.5 seconds so user sees success message before redirecting
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);

          // Fire both sync APIs in the background so we don't block the UI
          Promise.all([syncAwsCostApi(), syncAwsBillingApi()]).catch((err) =>
            console.error("Failed to sync billing data after connecting", err),
          );
        } else {
          // We can optionally pass result.message to the ValidationStatus component
          // For now, setting 'error' triggers the UI state
          setValidationStatus("error");
        }
      }
    };

    performValidation();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, credentials, handleConnectAws]);

  const handleNext = () => {
    if (step === 1 && provider !== "aws") {
      setShowComingSoon(true);
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      if (step === 3) {
        setValidationStatus("idle"); // reset validation when going back
      }
      setStep(step - 1);
    }
  };

  const handleProviderSelect = (selected) => {
    setProvider(selected);
  };

  const handleCredentialChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleRetry = () => {
    setStep(2);
    setValidationStatus("idle");
  };

  return (
    <div className={styles.container}>
      {/* Header */}

      <div className={styles.logoContainer}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="white"
            strokeWidth="2"
          ></circle>
          <path
            d="M10 16C10 13 12 10 16 10C20 10 22 13 22 16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          ></path>
          <circle cx="16" cy="20" r="2" fill="white"></circle>
        </svg>
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
        <div className={`${styles.actions} ${step === 1 ? styles.right : ""}`}>
          {step > 1 && validationStatus !== "success" && (
            <button className={styles.btnBack} onClick={handleBack}>
              Back
            </button>
          )}

          {step === 1 && (
            <button className={styles.btnNext} onClick={handleNext}>
              Continue
            </button>
          )}

          {step === 2 && (
            <button
              className={`${styles.btnNext} ${!credentials.accessKey || !credentials.secretKey ? styles.btnDisabled : ""}`}
              onClick={handleNext}
              disabled={!credentials.accessKey || !credentials.secretKey}
            >
              Connect
            </button>
          )}

          {step === 3 && validationStatus === "success" && (
            <button
              className={styles.btnNext}
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Coming Soon Popup */}
      {showComingSoon && (
        <div className={styles.popupOverlay} onClick={() => setShowComingSoon(false)}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className={styles.popupTitle}>Coming Soon</h3>
            <p className={styles.popupText}>
              Support for {provider === "gcp" ? "Google Cloud Platform" : "Microsoft Azure"} is currently under active development. Stay tuned for updates!
            </p>
            <button className={styles.popupBtn} onClick={() => setShowComingSoon(false)}>
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect;
