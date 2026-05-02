import styles from "./Loader.module.css";

/**
 * Normal spinner Loader
 * Props:
 *   size    — 'sm' | 'md' | 'lg'   (default: 'md')
 *   label   — optional text beneath the spinner
 *   fullPage — centres the loader in the whole viewport (default: false)
 */
const Loader = ({ size = "md", label, fullPage = false }) => {
  return (
    <div
      className={`${styles.wrapper} ${fullPage ? styles.fullPage : ""}`}
      role="status"
      aria-label={label || "Loading…"}
    >
      <span className={`${styles.spinner} ${styles[size]}`} />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
};

export default Loader;
