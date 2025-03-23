import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './HotelBooking.module.css';
import hotelIllustration from '../assets/images/Booking_p.png';
import indianFlag from '../assets/images/india-flag.svg';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
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
  const [userVerified, setUserVerified] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  const [formData, setFormData] = useState({
    roomType: selectedRoom.name || 'Master Suite',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: '2',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  // Get max guests based on room type
  const getMaxGuests = (roomType) => {
    switch(roomType) {
      case 'Master Suite':
        return 4;
      case 'Honeymoon Suite':
        return 2;
      case 'Deluxe Room':
        return 3;
      case 'Standard Room':
        return 3;
      default:
        return 2;
    }
  };

  // Update number of guests options when room type changes
  useEffect(() => {
    // Reset number of guests if it exceeds the maximum for the selected room
    const maxGuests = getMaxGuests(formData.roomType);
    if (parseInt(formData.numberOfGuests) > maxGuests) {
      setFormData(prev => ({
        ...prev,
        numberOfGuests: maxGuests.toString()
      }));
    }
  }, [formData.roomType]);

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

  // Function to verify user and auto-fill data
  const verifyUser = async () => {
    if (!formData.username) {
      setError('Please enter a username');
      return;
    }

    setIsSubmitting(true);
    try {
      // Query Firestore to find user by username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', formData.username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setUserNotFound(true);
        setUserVerified(false);
        setError('User not found. Please check your username or register first.');
      } else {
        // Get the user data
        const userData = querySnapshot.docs[0].data();
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          email: userData.email || '',
        }));
        setUserVerified(true);
        setUserNotFound(false);
        setError('');
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      setError('Error verifying user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    
    if (!userVerified) {
      setError('Please verify your username first');
      return;
    }
    
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
        checkOutDate: formData.checkOutDate,
        numberOfGuests: parseInt(formData.numberOfGuests),
        username: formData.username,
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

  // Generate guest options based on room type
  const renderGuestOptions = () => {
    const maxGuests = getMaxGuests(formData.roomType);
    const options = [];
    
    for (let i = 1; i <= maxGuests; i++) {
      options.push(
        <option key={i} value={i.toString()}>{i}</option>
      );
    }
    
    return options;
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
              <div className={styles.fieldHint}>
                {formData.roomType === 'Master Suite' && 'Maximum 4 guests allowed'}
                {formData.roomType === 'Honeymoon Suite' && 'Maximum 2 guests allowed'}
                {formData.roomType === 'Deluxe Room' && 'Maximum 3 guests allowed'}
                {formData.roomType === 'Standard Room' && 'Maximum 3 guests allowed'}
              </div>
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
                <div className={styles.fieldHint}>Check-in time is 11:00 AM</div>
              </div>
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
                <div className={styles.fieldHint}>Check-out time is 12:00 PM</div>
              </div>
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
                {renderGuestOptions()}
              </select>
            </div>

            <h2>Personal Information</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <div className={styles.usernameVerifyContainer}>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isSubmitting || userVerified}
                    required
                    placeholder="Enter your registered username"
                  />
                  <button 
                    type="button" 
                    onClick={verifyUser} 
                    disabled={isSubmitting || userVerified}
                    className={styles.verifyButton}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {userVerified && <div className={styles.verifiedText}>✓ User verified</div>}
                {userNotFound && <div className={styles.errorText}>User not found. Please register first.</div>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting || !userVerified}
                  readOnly={userVerified}
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
                  disabled={isSubmitting || !userVerified}
                  readOnly={userVerified}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting || !userVerified}
                  readOnly={userVerified}
                  required
                />
              </div>
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
                    disabled={isSubmitting || !userVerified}
                    readOnly={userVerified}
                    required
                  />
                </div>
                {formData.phone && formData.phone.length !== 10 && (
                  <span className={styles.errorText}>
                    Phone number must be 10 digits
                  </span>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting || !userVerified}
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
