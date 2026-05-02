import RegisterForm from '../components/RegisterForm';
import styles from './Register.module.css';

const Register = () => {
  return (
    <div className={styles.authContainer}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoCircle}>C</div>
            <div className={styles.brandName}>Cloudburn</div>
            <h1 className={styles.pageTitle}>Create your account</h1>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
