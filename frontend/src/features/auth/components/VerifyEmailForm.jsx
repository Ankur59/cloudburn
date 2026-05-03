import { useNavigate, useLocation } from "react-router-dom";
import styles from "./VerifyEmailForm.module.css";

const VerifyEmailForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // email may be passed via router state from the register page
  const emailHint = location.state?.email || "your email address";

  return (
    <div className={styles.form}>
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-secondary)" }}
        >
          <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
          <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
        </svg>
      </div>

      <h2 style={{ textAlign: "center", fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "0.25rem", fontWeight: "600" }}>
        Check your email
      </h2>
      
      <p className={styles.hint} style={{ marginBottom: "1.5rem" }}>
        We have sent a verification link to <br />
        <strong>{emailHint}</strong>.<br /><br />
        Please check your inbox and click the link to verify your account and continue.
      </p>

      <button
        type="button"
        onClick={() => navigate("/login")}
        className={styles.submitButton}
      >
        Return to Login
      </button>

      <p className={styles.hint} style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
        Didn&apos;t receive the email? Please check your spam folder or try registering again.
      </p>
    </div>
  );
};

export default VerifyEmailForm;
