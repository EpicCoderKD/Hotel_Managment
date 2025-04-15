import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import styles from '../styles/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  useEffect(() => {
    // Fetch feedback data
    const fetchFeedbacks = async () => {
      try {
        const feedbackRef = collection(db, 'feedback');
        const snapshot = await getDocs(feedbackRef);
        const feedbackData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort feedbacks by date in descending order
        feedbackData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setFeedbacks(feedbackData);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setFeedbackLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i} className={styles.star}>★</span>);
    }
    return stars;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Feedback ({feedbacks.length})</h2>
        <div className={styles.reportTable}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Rating</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {feedbackLoading ? (
                <tr>
                  <td colSpan="3" className={styles.loadingCell}>Loading feedback...</td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.emptyCell}>No feedback available</td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.id}>
                    <td>{formatDate(feedback.date)}</td>
                    <td className={styles.ratingCell}>
                      <div className={styles.stars}>
                        {renderStars(feedback.rating)}
                      </div>
                      <span className={styles.ratingNumber}>{feedback.rating}</span>
                    </td>
                    <td className={styles.feedbackText}>{feedback.feedback}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 