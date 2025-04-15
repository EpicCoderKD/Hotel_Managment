import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateBookingPayment } from '../utils/paymentUtils';
import styles from './Payment.module.css';

const Payment = ({ bookingData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePaymentConfirmation = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      const paymentData = {
        amount: bookingData.totalAmount,
        paymentId: 'PAY_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      };

      // Update booking with payment information
      await updateBookingPayment(bookingData.id, paymentData);

      // Show success message
      alert('Payment successful! Your booking is confirmed.');
      navigate('/bookings'); // Redirect to bookings page
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.paymentContainer}>
      <h2>Payment Details</h2>
      <div className={styles.paymentInfo}>
        <div className={styles.bookingDetails}>
          <h3>Booking Summary</h3>
          <p><strong>Branch:</strong> {bookingData.branchName}</p>
          <p><strong>Room Type:</strong> {bookingData.roomType}</p>
          <p><strong>Check-in:</strong> {new Date(bookingData.checkInDate).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> {new Date(bookingData.checkOutDate).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹{bookingData.totalAmount.toLocaleString('en-IN')}</p>
        </div>

        <div className={styles.paymentMethod}>
          <h3>Payment Method</h3>
          <div className={styles.paymentOptions}>
            <label className={styles.paymentOption}>
              <input type="radio" name="paymentMethod" value="card" defaultChecked />
              <span>Credit/Debit Card</span>
            </label>
            <label className={styles.paymentOption}>
              <input type="radio" name="paymentMethod" value="upi" />
              <span>UPI</span>
            </label>
            <label className={styles.paymentOption}>
              <input type="radio" name="paymentMethod" value="netbanking" />
              <span>Net Banking</span>
            </label>
          </div>

          <button 
            className={styles.payButton}
            onClick={handlePaymentConfirmation}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay ₹${bookingData.totalAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment; 