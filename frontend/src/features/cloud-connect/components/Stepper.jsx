import React from 'react';
import { Check } from 'lucide-react';
import styles from './Stepper.module.css';

const Stepper = ({ currentStep }) => {
  return (
    <div className={styles.stepper}>
      <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
        <div className={styles.stepIcon}>
          {currentStep > 1 ? <Check size={16} strokeWidth={3} /> : '1'}
        </div>
        <span>Choose Provider</span>
      </div>
      <div className={`${styles.stepLine} ${currentStep > 1 ? styles.activeLine : ''}`} />
      
      <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
        <div className={styles.stepIcon}>
          {currentStep > 2 ? <Check size={16} strokeWidth={3} /> : '2'}
        </div>
        <span>Enter Credentials</span>
      </div>
      <div className={`${styles.stepLine} ${currentStep > 2 ? styles.activeLine : ''}`} />
      
      <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
        <div className={styles.stepIcon}>3</div>
        <span>Validation</span>
      </div>
    </div>
  );
};

export default Stepper;
