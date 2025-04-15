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
  const selectedBranch = location.state?.branch || { name: 'Coorg' };
  const preSelectedCheckInDate = location.state?.checkInDate || '';
  const preSelectedCheckOutDate = location.state?.checkOutDate || '';
  
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
    branch: selectedBranch.name || 'Coorg',
    checkInDate: preSelectedCheckInDate,
    checkOutDate: preSelectedCheckOutDate,
    adults: '2',
    children: '0',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    comments: ''
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
    const totalGuests = parseInt(formData.adults) + parseInt(formData.children);
    
    if (totalGuests > maxGuests) {
      setFormData(prev => ({
        ...prev,
        adults: Math.min(parseInt(prev.adults), maxGuests).toString(),
        children: Math.max(0, maxGuests - parseInt(prev.adults)).toString()
      }));
    }
  }, [formData.roomType, formData.adults, formData.children]);

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

    // Handle adults and children count changes
    if (name === 'adults' || name === 'children') {
      const maxGuests = getMaxGuests(formData.roomType);
      let newAdults = parseInt(formData.adults);
      let newChildren = parseInt(formData.children);
      
      if (name === 'adults') {
        newAdults = parseInt(value);
      } else {
        newChildren = parseInt(value);
      }
      
      const totalGuests = newAdults + newChildren;
      
      if (totalGuests <= maxGuests) {
        setFormData(prevState => ({
          ...prevState,
          [name]: value
        }));
      } else {
        setError(`Total guests cannot exceed ${maxGuests} for ${formData.roomType}`);
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

  // Check room availability for selected dates
  const checkRoomAvailability = async () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      setError('Please select both check-in and check-out dates');
      return false;
    }

    const inDate = new Date(formData.checkInDate);
    const outDate = new Date(formData.checkOutDate);

    if (inDate >= outDate) {
      setError('Check-out date must be after check-in date');
      return false;
    }

    try {
      setIsSubmitting(true);
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(query(
        bookingsRef,
        where('branch', '==', formData.branch),
        where('roomType', '==', formData.roomType),
        where('status', 'in', ['confirmed', 'pending'])
      ));

      let isAvailable = true;
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);

      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        const bookingCheckIn = new Date(booking.checkInDate);
        const bookingCheckOut = new Date(booking.checkOutDate);

        // Check for date overlap
        if (
          (checkIn >= bookingCheckIn && checkIn < bookingCheckOut) ||
          (checkOut > bookingCheckIn && checkOut <= bookingCheckOut) ||
          (checkIn <= bookingCheckIn && checkOut >= bookingCheckOut)
        ) {
          isAvailable = false;
        }
      });

      return isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      setError('Error checking room availability');
      return false;
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

    // Check room availability before proceeding
    const isAvailable = await checkRoomAvailability();
    if (!isAvailable) {
      setError('This room is not available for the selected dates. Please choose different dates.');
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
        branch: formData.branch,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
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
        comments: formData.comments
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

  // Generate options from 0-max
  const renderOptions = (max, startFrom = 0) => {
    const options = [];
    for (let i = startFrom; i <= max; i++) {
      options.push(
        <option key={i} value={i.toString()}>{i}</option>
      );
    }
    return options;
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

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
              <label>Branch</label>
              <select 
                name="branch" 
                value={formData.branch}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="Coorg">Coorg</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>
            
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
                  disabled={isSubmitting}
                  min={today}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-out date</label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  min={formData.checkInDate || today}
                  required
                />
              </div>
            </div>

            <div className={styles.guestsSection}>
              <h3>Number of Guests</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Adults</label>
                  <select
                    name="adults"
                    value={formData.adults}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {renderOptions(getMaxGuests(formData.roomType), 1)}
                  </select>
                  <div className={styles.fieldHint}>12 years and above</div>
                </div>
                <div className={styles.formGroup}>
                  <label>Children</label>
                  <select
                    name="children"
                    value={formData.children}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {renderOptions(getMaxGuests(formData.roomType) - parseInt(formData.adults))}
                  </select>
                  <div className={styles.fieldHint}>Under 11 years</div>
                </div>
              </div>
              <div className={styles.guestSummary}>
                Total Guests: <span>{parseInt(formData.adults) + parseInt(formData.children)}</span> out of <span>{getMaxGuests(formData.roomType)}</span> maximum
              </div>
            </div>

            <h2>Personal Information</h2>
            
            <div className={styles.usernameVerification}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isSubmitting || userVerified}
                  required
                />
              </div>
              <button 
                type="button" 
                className={styles.verifyButton}
                onClick={verifyUser}
                disabled={isSubmitting || userVerified || !formData.username}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            
            {userVerified && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name</label>
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
                    <label>Last Name</label>
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
                    <label>Phone Number</label>
                    <div className={styles.phoneInput}>
                      <div className={styles.countryCode}>
                        <img src={indianFlag} alt="India flag" />
                        <span>+91</span>
                      </div>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength="10"
                        placeholder="10-digit number"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
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

                <div className={styles.formGroup}>
                  <label>Comments or Special Requests</label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    placeholder="Please share any special requests or comments about your stay..."
                    className={styles.commentInput}
                    rows="4"
                    disabled={isSubmitting}
                  />
                </div>

                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Book Now'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {showAlert && (
        <BookingAlert 
          onClose={handleCloseAlert} 
          bookingId={bookingId}
          bookingData={bookingData}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default HotelBooking;
