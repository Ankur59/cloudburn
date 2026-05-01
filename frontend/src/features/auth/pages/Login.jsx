import LoginForm from '../components/LoginForm';
import styles from './Login.module.css';

const Login = () => {
  return (
    <div className={styles.authContainer}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoCircle}>C</div>
            <div className={styles.brandName}>Cloudburn</div>
            <h1 className={styles.pageTitle}>Sign in to your account</h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
