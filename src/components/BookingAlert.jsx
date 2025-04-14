import React from 'react';
import styles from './BookingAlert.module.css';
import { FaCheckCircle, FaTimes, FaCreditCard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BookingAlert = ({ bookingId, bookingData, onClose, isPaymentSuccess }) => {
  const navigate = useNavigate();

  const handleProceedToPayment = () => {
    navigate('/payment', { state: { bookingId, bookingData } });
  };

  return (
    <div className={styles.alertOverlay}>
      <div className={styles.alertContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <div className={styles.alertIcon}>
          <FaCheckCircle />
        </div>
        <h2>{isPaymentSuccess ? 'Payment Successful!' : 'Booking Confirmed!'}</h2>
        <p>{isPaymentSuccess 
          ? 'Your payment has been successfully processed.'
          : 'Your booking has been successfully submitted.'}
        </p>
        <div className={styles.bookingDetails}>
          <p>Booking Reference:</p>
          <span className={styles.bookingId}>{bookingId}</span>
        </div>
        <p className={styles.alertNote}>
          We've sent a confirmation email with your booking details.
          Please check your inbox.
        </p>
        
        {!isPaymentSuccess && (
          <button 
            className={styles.paymentButton} 
            onClick={handleProceedToPayment}
          >
            <FaCreditCard /> Proceed to Payment
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingAlert; 