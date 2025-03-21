import React, { useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import styles from './HotelBooking.module.css';
import hotelIllustration from '../assets/images/Booking_p.png';
import indianFlag from '../assets/images/india-flag.svg';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Footer from './Footer';
import BookingAlert from './BookingAlert';
import Header from './Header';

const HotelBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoom = location.state?.room || {};
  const servicesRef = useRef(null);
  const storyRef = useRef(null);
  const aboutRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingData, setBookingData] = useState(null);

  const [formData, setFormData] = useState({
    roomType: selectedRoom.name || 'Master Suite',
    checkInDate: '',
    checkInTime: '10:00',
    checkOutDate: '',
    numberOfGuests: '2',
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError(''); // Clear any previous errors
    
    if (name === 'phone') {
      const phoneNumber = value.replace(/\D/g, '');
      if (phoneNumber.length <= 10) {
        setFormData(prevState => ({
          ...prevState,
          [name]: phoneNumber
        }));
      }
      return;
    }
    
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create a unique document ID using customer name and timestamp
      const timestamp = new Date().getTime();
      const documentId = `${formData.firstName}_${formData.lastName}_${timestamp}`;
      
      // Format the data properly
      const bookingData = {
        roomType: formData.roomType || 'Standard Room',
        checkInDate: formData.checkInDate,
        checkInTime: formData.checkInTime,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: parseInt(formData.numberOfGuests),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        roomDetails: {
          name: selectedRoom.name || formData.roomType,
          price: selectedRoom.price || '',
        },
        status: 'pending',
        createdAt: new Date(),
        bookingDate: new Date(),
      };

      // Add to Firestore with custom document ID
      const bookingRef = doc(db, 'bookings', documentId);
      await setDoc(bookingRef, bookingData);
      
      setBookingId(documentId);
      setBookingData(bookingData); // Store booking data for payment page
      setShowAlert(true);
      
      // Don't navigate automatically, let user choose to proceed to payment
    } catch (error) {
      console.error('Error submitting booking:', error);
      setError('Error submitting booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    navigate('/accommodation');
  };

  return (
    <div className={styles.container}>
      <Header />
      <header className={styles.pageHeader}>
        <h1>Hotel Booking</h1>
        <p>Complete your reservation details</p>
      </header>
      <div className={styles.formCard}>
        <div className={styles.leftSection}>
          <h1>RESERVATION</h1>
          <p>Please place online reservation at least 3 days<br />in advance by simply completing the form<br />and request booking to us.</p>
          <div 
            className={styles.illustration}
            style={{ backgroundImage: `url(${hotelIllustration})` }}
          />
        </div>
        
        <div className={styles.rightSection}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <h2>Reservation Information</h2>
            
            <div className={styles.formGroup}>
              <label>Room type</label>
              <select 
                name="roomType" 
                value={formData.roomType}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="Master Suite">Master Suite</option>
                <option value="Deluxe Room">Deluxe Room</option>
                <option value="Standard Room">Standard Room</option>
                <option value="Honeymoon Suite">Honeymoon Suite</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Check-in date</label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-in time</label>
                <input
                  type="time"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleChange}
                  min="10:00"
                  max="20:00"
                  step="1800"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Check-out date</label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Number of guests</label>
                <select
                  name="numberOfGuests"
                  value={formData.numberOfGuests}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>

            <h2>Personal Information</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <div className={styles.phoneInputContainer} title="Enter Indian mobile number">
                  <div className={styles.countryCode}>
                    <img src={indianFlag} alt="Indian flag" className={styles.flagIcon} />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {formData.phone && formData.phone.length !== 10 && (
                  <span className={styles.errorText}>
                    Phone number must be 10 digits
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>

      {showAlert && (
        <BookingAlert 
          bookingId={bookingId}
          bookingData={bookingData}
          onClose={handleCloseAlert}
          isPaymentSuccess={false}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default HotelBooking;
