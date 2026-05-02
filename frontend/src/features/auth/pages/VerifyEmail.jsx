import VerifyEmailForm from "../components/VerifyEmailForm";
import styles from "./Login.module.css";

const VerifyEmail = () => {
  return (
    <div className={styles.authContainer}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoCircle}>C</div>
            <div className={styles.brandName}>Cloudburn</div>
            <h1 className={styles.pageTitle}>Verify your email</h1>
          </div>
          <VerifyEmailForm />
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
