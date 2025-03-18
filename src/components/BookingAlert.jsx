import React from 'react';
import styles from './BookingAlert.module.css';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const BookingAlert = ({ bookingId, onClose }) => {
  return (
    <div className={styles.alertOverlay}>
      <div className={styles.alertContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <div className={styles.alertIcon}>
          <FaCheckCircle />
        </div>
        <h2>Booking Confirmed!</h2>
        <p>Your booking has been successfully submitted.</p>
        <div className={styles.bookingDetails}>
          <p>Booking Reference:</p>
          <span className={styles.bookingId}>{bookingId}</span>
        </div>
        <p className={styles.alertNote}>
          We've sent a confirmation email with your booking details.
          Please check your inbox.
        </p>
      </div>
    </div>
  );
};

export default BookingAlert; 