import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Feedback.module.css';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
        setError('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const renderStars = (rating) => {
    return '⭐'.repeat(rating);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  if (loading) {
    return <div className={styles.loading}>Loading feedback...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.feedbackContainer}>
      <h2 className={styles.title}>Guest Feedback ({feedbacks.length})</h2>
      
      <div className={styles.feedbackGrid}>
        <div className={styles.headerRow}>
          <div className={styles.dateHeader}>Date</div>
          <div className={styles.ratingHeader}>Rating</div>
          <div className={styles.feedbackHeader}>Feedback</div>
        </div>

        {feedbacks.map((feedback) => (
          <div key={feedback.id} className={styles.feedbackRow}>
            <div className={styles.date}>{formatDate(feedback.date)}</div>
            <div className={styles.rating}>
              {renderStars(feedback.rating)}
              <span className={styles.ratingNumber}>{feedback.rating}</span>
            </div>
            <div className={styles.feedbackText}>{feedback.feedback}</div>
          </div>
        ))}

        {feedbacks.length === 0 && (
          <div className={styles.noFeedback}>
            No feedback available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback; 