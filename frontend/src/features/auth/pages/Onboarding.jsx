import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useAuth from '../hook/useAuth';
import pageStyles from './Login.module.css';
import formStyles from '../components/LoginForm.module.css';

const Onboarding = () => {
  const { handleSetOrgName } = useAuth();
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Pre-fill from the org name already created at registration (returned by getMe)
  const [orgName, setOrgName] = useState(user?.orgName || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    const result = await handleSetOrgName(orgName);
    if (result.success) {
      navigate('/connect');
    }
  };

  return (
    <div className={pageStyles.authContainer}>
      <div className={pageStyles.cardWrapper}>
        <div className={pageStyles.card}>
          <div className={pageStyles.cardHeader}>
            <div className={pageStyles.logoCircle}>C</div>
            <div className={pageStyles.brandName}>Cloudburn</div>
            <h1 className={pageStyles.pageTitle}>Welcome to Cloudburn!</h1>
            <p className={pageStyles.subtitle} style={{ textAlign: 'center', color: '#888', marginTop: '10px' }}>
              Confirm your organization name to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={formStyles.form}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label} htmlFor="orgName">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="E.g., Acme Corp"
                className={formStyles.input}
                required
              />
              {user?.orgName && (
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>
                  This was set during registration — you can update it here.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className={formStyles.submitButton}
            >
              {loading ? (
                <span className={formStyles.spinnerContainer}>
                  <span className={formStyles.spinner} />
                  Saving...
                </span>
              ) : (
                'Continue to Connect Cloud'
              )}
            </button>

            {error && (
              <p className={formStyles.errorMessage} style={{ textAlign: 'center', marginTop: '10px' }}>
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
