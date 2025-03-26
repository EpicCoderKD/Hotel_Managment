import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Feedback.module.css';

const Feedback = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    feedback: '',
    isAnonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    if (feedbackList.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex + 1 >= Math.ceil(feedbackList.length / 3) ? 0 : prevIndex + 1
        );
      }, 10000);

      return () => clearInterval(timer);
    }
  }, [feedbackList.length]);

  const fetchFeedback = async () => {
    try {
      const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const sortedFeedback = feedbackData.sort((a, b) => {
        const ratingA = Number(a.rating);
        const ratingB = Number(b.rating);
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      setFeedbackList(sortedFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData = {
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'new'
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      setShowSuccess(true);
      
      setFormData({
        name: '',
        email: '',
        rating: 5,
        feedback: '',
        isAnonymous: false
      });

      fetchFeedback();

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedbackCards = () => {
    const startIndex = currentIndex * 3;
    const endIndex = startIndex + 3;
    const currentFeedback = feedbackList.slice(startIndex, endIndex);

    return currentFeedback.map((item) => (
      <div key={item.id} className={styles.feedbackCard}>
        <div className={styles.feedbackHeader}>
          <div className={styles.feedbackRating}>
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <span
                  key={index}
                  className={`${styles.star} ${starValue <= parseInt(item.rating) ? styles.active : ''}`}
                >
                  ★
                </span>
              );
            })}
          </div>
          <div className={styles.feedbackDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </div>
        </div>
        <p className={styles.feedbackText}>{item.feedback}</p>
        {!item.isAnonymous && (
          <div className={styles.feedbackAuthor}>
            <span className={styles.authorName}>{item.name}</span>
          </div>
        )}
      </div>
    ));
  };

  if (showSuccess) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.thankYouContainer}>
          <div className={styles.thankYouIcon}>★</div>
          <h1 className={styles.thankYouTitle}>Thank You for Your Feedback!</h1>
          <div className={styles.decorativeLine}></div>
          <p className={styles.thankYouMessage}>
            We truly appreciate you taking the time to share your experience with us. 
            Your feedback helps us maintain the highest standards of service for all our guests.
          </p>
          <a href="/" className={styles.returnButton}>
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Share Your Experience</h1>
        <p className={styles.heroSubtitle}>Your feedback helps us provide better service to our guests</p>
      </div>

      <div className={styles.pageContainer}>
        <div className={styles.feedbackContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Tell Us About Your Stay</h2>
            <p className={styles.formSubtitle}>We value your opinion and use it to improve our services</p>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.feedbackForm}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                Submit anonymously
              </label>
            </div>

            {!formData.isAnonymous && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="Enter your name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="rating">Rating</label>
              <div className={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`${styles.star} ${star <= formData.rating ? styles.active : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="feedback">Your Feedback</label>
              <textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Share your experience with us..."
                required
              />
            </div>

            <button 
              type="submit" 
              className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        <div className={styles.feedbackListContainer}>
          <div className={styles.listHeader}>
            <h2 className={styles.feedbackListTitle}>Guest Reviews</h2>
            <p className={styles.listSubtitle}>See what our guests have to say about their stay</p>
          </div>
          {isLoading ? (
            <div className={styles.loadingMessage}>Loading feedback...</div>
          ) : feedbackList.length === 0 ? (
            <div className={styles.noFeedbackMessage}>No feedback yet. Be the first to share your experience!</div>
          ) : (
            <div className={styles.feedbackCarousel}>
              <div className={styles.feedbackList}>
                {renderFeedbackCards()}
              </div>
              <div className={styles.carouselIndicators}>
                {[...Array(Math.ceil(feedbackList.length / 3))].map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${currentIndex === index ? styles.active : ''}`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback; 