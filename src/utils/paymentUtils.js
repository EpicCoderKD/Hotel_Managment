import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const updateBookingPayment = async (bookingId, paymentData) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      totalAmount: paymentData.amount,
      paymentStatus: 'paid',
      paymentTimestamp: new Date().toISOString(),
      paymentId: paymentData.paymentId,
      status: 'confirmed'
    });
    return true;
  } catch (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }
}; 