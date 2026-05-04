import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hook/useAuth";
import VerifyEmailForm from "../components/VerifyEmailForm";
import styles from "./Login.module.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleVerifyEmail } = useAuth();

  const tokenFromUrl = searchParams.get("token");

  const [status, setStatus] = useState(
    tokenFromUrl ? "loading" : "idle" // "loading" | "success" | "error" | "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!tokenFromUrl) return;

    handleVerifyEmail(tokenFromUrl).then((result) => {
      if (result.success) {
        setStatus("success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatus("error");
        setErrorMsg(result.message || "Verification failed. The link may have expired.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className={styles.spinner} style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary, #9ca3af)" }}>Verifying your email…</p>
        </div>
      );
    }

    if (status === "success") {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
          <p style={{ color: "#22c55e", fontWeight: 600 }}>Email verified successfully!</p>
          <p style={{ color: "var(--text-secondary, #9ca3af)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Redirecting you to login…
          </p>
        </div>
      );
    }

    if (status === "error") {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>❌</div>
          <p style={{ color: "#ef4444", fontWeight: 600 }}>Verification failed</p>
          <p style={{ color: "var(--text-secondary, #9ca3af)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {errorMsg}
          </p>
          <button
            onClick={() => navigate("/login")}
            className={styles.submitButton}
            style={{ marginTop: "1.5rem" }}
          >
            Back to Login
          </button>
        </div>
      );
    }

    // idle — no token in URL, show the manual form
    return <VerifyEmailForm />;
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoCircle}>C</div>
            <div className={styles.brandName}>Cloudburn</div>
            <h1 className={styles.pageTitle}>Verify your email</h1>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
