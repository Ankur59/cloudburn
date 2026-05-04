import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "../hook/useAuth";
import styles from "./RegisterForm.module.css";

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.64 9.20441C17.64 8.5666 17.5791 7.95702 17.4668 7.375L9 7.875V10.875H13.8842C13.703 11.9581 13.1462 12.8735 12.2468 13.5246L14.9468 15.8246C16.6927 14.3279 17.64 11.9952 17.64 9.20441Z"
      fill="#4285F4"
    />
    <path
      d="M9 18C11.43 18 13.44 17.135 14.9468 15.8246L12.2468 13.5246C11.4584 14.1032 10.43 14.4558 9 14.4558C6.675 14.4558 4.71209 12.8813 4.14028 10.8014L1.32028 12.9714C2.83875 15.9341 5.73982 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M4.14028 10.8014C3.95578 10.2195 3.85841 9.595 3.85841 8.95585C3.85841 8.31668 3.95578 7.6922 4.14028 7.11031L1.32028 4.94034C0.602617 6.21106 0.18 7.56617 0.18 8.95585C0.18 10.3455 0.602617 11.7006 1.32028 12.9714L4.14028 10.8014Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.45586C10.4684 3.45586 11.764 4.0205 12.7108 4.94606L15.0168 2.64006C13.4277 1.1573 11.4292 0.272461 9 0.272461C5.73982 0.272461 2.83875 2.33856 1.32028 5.30133L4.14028 7.4713C4.71209 5.39142 6.675 3.81689 9 3.81689V3.45586Z"
      fill="#EA4335"
    />
  </svg>
);

const RegisterForm = () => {
  const { handleRegister, handleGoogleLoginRedirect } = useAuth();
  const { loading, error } = useSelector((state) => state.auth);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    // Backend takes: { orgName, name, email, password }
    const result = await handleRegister({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (result.success) {
      setRegisteredEmail(data.email);
    } else if (result.firstFieldError) {
      // Show the error inline on the specific field
      setError(result.firstFieldError.path, {
        type: "server",
        message: result.firstFieldError.msg,
      });
    }
  };

  // ── Post-registration success screen ─────────────────────────────────────
  if (registeredEmail) {
    return (
      <div className={styles.form} style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Check your inbox</h2>
        <p style={{ color: "var(--text-secondary, #9ca3af)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          We sent a verification link to{" "}
          <strong style={{ color: "inherit" }}>{registeredEmail}</strong>.<br />
          Click the link in the email to activate your account.
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-secondary, #9ca3af)" }}>
          Already verified?{" "}
          <Link to="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <button 
        type="button" 
        className={styles.googleButton}
        onClick={handleGoogleLoginRedirect}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span>or continue with email</span>
        <span className={styles.dividerLine} />
      </div>

      

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="Alex Johnson"
          className={`${styles.input} ${errors.name ? styles.error : ""}`}
          {...register("name", { required: "Full name is required." })}
        />
        {errors.name && (
          <p className={styles.errorMessage}>{errors.name.message}</p>
        )}
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
          className={`${styles.input} ${errors.email ? styles.error : ""}`}
          {...register("email", {
            required: "Email is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        {errors.email && (
          <p className={styles.errorMessage}>{errors.email.message}</p>
        )}
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
          className={`${styles.input} ${errors.password ? styles.error : ""}`}
          {...register("password", {
            required: "Password is required.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
          })}
        />
        {errors.password && (
          <p className={styles.errorMessage}>{errors.password.message}</p>
        )}
      </div>


      <button
        type="submit"
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? (
          <span className={styles.spinnerContainer}>
            <span className={styles.spinner} />
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </button>

      <div className={styles.footerText}>
        Already have an account?{" "}
        <Link to="/login" className={styles.footerLink}>
          Sign in
        </Link>
      </div>

      {error && (
        <p className={styles.errorMessage} style={{ textAlign: "center" }}>{error}</p>
      )}
    </form>
  );
};

export default RegisterForm;
