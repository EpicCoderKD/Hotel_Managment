import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './AdminReports.module.css';

const AdminReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const startDateTime = new Date(startDate).toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

      // Fetch bookings
      const bookingsCollection = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsCollection,
        where('checkInDate', '>=', startDateTime),
        where('checkInDate', '<=', endDateTime),
        orderBy('checkInDate', 'desc')
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          paymentAmount: parseFloat(data.paymentAmount || 0).toLocaleString('en-IN')
        };
      });

      // Fetch feedback
      const feedbackCollection = collection(db, 'feedback');
      const feedbackQuery = query(
        feedbackCollection,
        where('timestamp', '>=', startDateTime),
        where('timestamp', '<=', endDateTime),
        orderBy('timestamp', 'desc')
      );

      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackData = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().timestamp).toLocaleDateString()
      }));

      setBookings(bookingsData);
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  const renderStars = (rating) => '⭐'.repeat(rating);

  const totalRevenue = bookings.reduce((sum, booking) => {
    const amount = parseFloat(booking.paymentAmount?.replace(/,/g, '') || 0);
    return sum + amount;
  }, 0);

  const averageRating = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length)
    : 0;

  return (
    <div className={styles.reportsContainer}>
      <h2>Reports Dashboard</h2>

      <div className={styles.dateSelector}>
        <div className={styles.dateInput}>
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateInput}>
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          className={styles.generateButton}
          onClick={fetchReportData}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          {error.includes('index') && (
            <div className={styles.errorHelp}>
              Please create the required index in Firebase Console
            </div>
          )}
        </div>
      )}

      {(bookings.length > 0 || feedbacks.length > 0) && (
        <div className={styles.reportContent}>
          <div className={styles.bookingsSection}>
            <h3>Bookings ({bookings.length})</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>User Name</th>
                    <th>Branch</th>
                    <th>Room Type</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Payment Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.id.substring(0, 8)}...</td>
                      <td>{booking.userName || `${booking.firstName} ${booking.lastName}`}</td>
                      <td>{booking.branchName || booking.branch}</td>
                      <td>{booking.roomType}</td>
                      <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                      <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                      <td>₹{booking.paymentAmount}</td>
                      <td>
                        <span className={`${styles.status} ${styles[booking.status]}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.feedbackSection}>
            <h3>Feedback ({feedbacks.length})</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map(item => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td className={styles.ratingCell}>
                        <span className={styles.ratingNumber}>{item.rating}</span>
                        <span className={styles.stars}>{renderStars(item.rating)}</span>
                      </td>
                      <td className={styles.feedbackText}>{item.feedback}</td>
                    </tr>
                  ))}
                  {feedbacks.length === 0 && (
                    <tr>
                      <td colSpan="3" className={styles.emptyCell}>
                        No feedback available for the selected date range
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.statsCards}>
  {bookings.length > 0 && (
    <div className={styles.revenueCard}>
      <h3>Total Revenue</h3>
      <p>₹{totalRevenue.toLocaleString('en-IN')}</p>
    </div>
  )}
  {feedbacks.length > 0 && (
    <div className={styles.revenueCard}>
      <h3>Average Rating</h3>
      <p>
        {averageRating}
        <span className={styles.stars}>{'⭐'.repeat(averageRating)}</span>
      </p>
    </div>
  )}
</div>

        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          Loading report data...
        </div>
      )}

      {!isLoading && bookings.length === 0 && feedbacks.length === 0 && startDate && endDate && (
        <div className={styles.noData}>
          No data found for the selected date range.
        </div>
      )}
    </div>
  );
};

export default AdminReports;
