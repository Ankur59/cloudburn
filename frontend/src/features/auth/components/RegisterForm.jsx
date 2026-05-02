import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import styles from './RegisterForm.module.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20441C17.64 8.5666 17.5791 7.95702 17.4668 7.375L9 7.875V10.875H13.8842C13.703 11.9581 13.1462 12.8735 12.2468 13.5246L14.9468 15.8246C16.6927 14.3279 17.64 11.9952 17.64 9.20441Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.44 17.135 14.9468 15.8246L12.2468 13.5246C11.4584 14.1032 10.43 14.4558 9 14.4558C6.675 14.4558 4.71209 12.8813 4.14028 10.8014L1.32028 12.9714C2.83875 15.9341 5.73982 18 9 18Z" fill="#34A853"/>
    <path d="M4.14028 10.8014C3.95578 10.2195 3.85841 9.595 3.85841 8.95585C3.85841 8.31668 3.95578 7.6922 4.14028 7.11031L1.32028 4.94034C0.602617 6.21106 0.18 7.56617 0.18 8.95585C0.18 10.3455 0.602617 11.7006 1.32028 12.9714L4.14028 10.8014Z" fill="#FBBC05"/>
    <path d="M9 3.45586C10.4684 3.45586 11.764 4.0205 12.7108 4.94606L15.0168 2.64006C13.4277 1.1573 11.4292 0.272461 9 0.272461C5.73982 0.272461 2.83875 2.33856 1.32028 5.30133L4.14028 7.4713C4.71209 5.39142 6.675 3.81689 9 3.81689V3.45586Z" fill="#EA4335"/>
  </svg>
);

const RegisterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      organization: '',
      fullName: '',
      email: '',
      password: '',
      role: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitStatus('');
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitStatus('Account created successfully.');
    console.log('Register data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <button type="button" className={styles.googleButton}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span>or continue with email</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="organization">
          Organization Name
        </label>
        <input
          id="organization"
          type="text"
          placeholder="Acme Corporation"
          className={`${styles.input} ${errors.organization ? styles.error : ''}`}
          {...register('organization', { required: 'Organization name is required.' })}
        />
        {errors.organization && <p className={styles.errorMessage}>{errors.organization.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          placeholder="Alex Johnson"
          className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
          {...register('fullName', { required: 'Full name is required.' })}
        />
        {errors.fullName && <p className={styles.errorMessage}>{errors.fullName.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={`${styles.input} ${errors.email ? styles.error : ''}`}
          {...register('email', {
            required: 'Email is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address.',
            },
          })}
        />
        {errors.email && <p className={styles.errorMessage}>{errors.email.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          className={`${styles.input} ${errors.password ? styles.error : ''}`}
          {...register('password', {
            required: 'Password is required.',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters.',
            },
          })}
        />
        {errors.password && <p className={styles.errorMessage}>{errors.password.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="role">
          Role
        </label>
        <select
          id="role"
          className={`${styles.select} ${errors.role ? styles.error : ''}`}
          defaultValue=""
          {...register('role', { required: 'Please select a role.' })}
        >
          <option value="" disabled>
            Select your role
          </option>
          <option value="org-admin">Org Admin</option>
          <option value="team-lead">Team Lead</option>
          <option value="developer">Developer</option>
        </select>
        {errors.role && <p className={styles.errorMessage}>{errors.role.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? (
          <span className={styles.spinnerContainer}>
            <span className={styles.spinner} />
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </button>

      <div className={styles.footerText}>
        Already have an account?{' '}
        <Link to="/login" className={styles.footerLink}>
          Sign in
        </Link>
      </div>

      {submitStatus && <div className={styles.successMessage}>{submitStatus}</div>}
    </form>
  );
};

export default RegisterForm;
