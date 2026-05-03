import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "../hook/useAuth";
import styles from "./VerifyEmailForm.module.css";

const VerifyEmailForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleVerifyEmail } = useAuth();
  const { loading, error } = useSelector((state) => state.auth);
  const [success, setSuccess] = useState("");

  // email may be passed via router state from the register page
  const emailHint = location.state?.email || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: { token: "" },
  });

  const onSubmit = async ({ token }) => {
    const result = await handleVerifyEmail(token.trim());
    if (result.success) {
      setSuccess("Email verified! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {emailHint && (
        <p className={styles.hint}>
          A verification token was sent to <strong>{emailHint}</strong>. Paste
          it below.
        </p>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="token">
          Verification Token
        </label>
        <input
          id="token"
          type="text"
          autoComplete="one-time-code"
          placeholder="Paste your token here"
          className={`${styles.input} ${errors.token ? styles.error : ""}`}
          {...register("token", { required: "Token is required." })}
        />
        {errors.token && (
          <p className={styles.errorMessage}>{errors.token.message}</p>
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
            Verifying…
          </span>
        ) : (
          "Verify Email"
        )}
      </button>

      {error && (
        <p className={styles.errorMessage} style={{ textAlign: "center" }}>
          {error}
        </p>
      )}
      {success && <div className={styles.successMessage}>{success}</div>}
    </form>
  );
};

export default VerifyEmailForm;
