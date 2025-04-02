import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './HotelBooking.module.css';
import hotelIllustration from '../assets/images/Booking_p.png';
import indianFlag from '../assets/images/india-flag.svg';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import Footer from './Footer';
import BookingAlert from './BookingAlert';
import Header from './Header';

const HotelBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoom = location.state?.room || {};
  const selectedBranch = location.state?.branch || 'coorg';
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
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [formData, setFormData] = useState({
    roomType: selectedRoom.name || 'Master Suite',
    branch: selectedBranch,
    checkInDate: preSelectedCheckInDate,
    checkOutDate: preSelectedCheckOutDate,
    adults: '2',
    children: '0',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  // Get max guests based on room type
  const getMaxGuests = (roomType) => {
    switch (roomType) {
      case 'Master Suite':
        return 4;
      case 'Deluxe Room':
        return 3;
      case 'Standard Room':
        return 3;
      case 'Honeymoon Suite':
        return 2;
      default:
        return 2;
    }
  };

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
    
    // If room type changes, need to recheck availability
    if (name === 'roomType') {
      setAvailableRooms([]);
      setSelectedRoomId('');
    }
    
    // If dates or branch changes, need to recheck availability
    if (name === 'checkInDate' || name === 'checkOutDate' || name === 'branch') {
      setAvailableRooms([]);
      setSelectedRoomId('');
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

  // Check for available rooms of the selected type
  const findAvailableRooms = async () => {
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
      setError('');
      
      // Query rooms collection for available rooms of the specified type
      const roomsRef = collection(db, 'rooms');
      const roomsQuery = query(
        roomsRef,
        where('branch', '==', formData.branch),
        where('roomType', '==', formData.roomType),
        where('isAvailable', '==', true),
        where('isBooked', '==', false)
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      
      // Get all available rooms
      const allAvailableRooms = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Now check if any of these rooms have overlapping bookings
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsRef,
        where('branch', '==', formData.branch),
        where('roomType', '==', formData.roomType),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());
      
      // Check date overlap for each available room
      const roomsWithNoOverlap = allAvailableRooms.filter(room => {
        // Find bookings for this specific room
        const roomBookings = bookings.filter(booking => 
          booking.roomId === room.roomId || booking.roomNumber === room.roomNumber
        );
        
        // Check if any booking overlaps with requested dates
        const hasOverlap = roomBookings.some(booking => {
          const bookingCheckIn = new Date(booking.checkInDate);
          const bookingCheckOut = new Date(booking.checkOutDate);
          
          return (
            (inDate >= bookingCheckIn && inDate < bookingCheckOut) ||
            (outDate > bookingCheckIn && outDate <= bookingCheckOut) ||
            (inDate <= bookingCheckIn && outDate >= bookingCheckOut)
          );
        });
        
        return !hasOverlap;
      });
      
      setAvailableRooms(roomsWithNoOverlap);
      
      if (roomsWithNoOverlap.length > 0) {
        // Automatically select the first available room
        setSelectedRoomId(roomsWithNoOverlap[0].id);
        return true;
      } else {
        setError('No rooms available for the selected dates. Please choose different dates or room type.');
        return false;
      }
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

    // Check for available rooms if we haven't already
    if (availableRooms.length === 0) {
      const roomsAvailable = await findAvailableRooms();
      if (!roomsAvailable) {
        return;
      }
    }

    // Make sure a room is selected
    if (!selectedRoomId) {
      setError('No room selected for booking. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the selected room details
      const selectedRoom = availableRooms.find(room => room.id === selectedRoomId);
      
      // Create a unique document ID using customer name and timestamp
      const timestamp = new Date().getTime();
      const documentId = `${formData.firstName}_${formData.lastName}_${timestamp}`;
      
      // Format the data properly
      const bookingData = {
        roomId: selectedRoom.roomId,
        roomNumber: selectedRoom.roomNumber,
        roomType: formData.roomType,
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
          name: formData.roomType,
          price: `₹${selectedRoom.pricePerNight}/night`,
          pricePerNight: selectedRoom.pricePerNight
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        bookingDate: new Date().toISOString(),
      };

      // Add to Firestore with custom document ID
      const bookingRef = doc(db, 'bookings', documentId);
      await setDoc(bookingRef, bookingData);
      
      // Update the room's status in the rooms collection
      const roomRef = doc(db, 'rooms', selectedRoomId);
      await updateDoc(roomRef, {
        isBooked: true,
        currentBookingId: documentId,
        lastBookingDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setBookingId(documentId);
      setBookingData(bookingData); // Store booking data for payment page
      setShowAlert(true);
      
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

  // Check availability when dates and room type are selected
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && formData.roomType) {
      findAvailableRooms();
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.roomType, formData.branch]);

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

      <div className={styles.bookingSection}>
        <div className={styles.bookingImage}>
          <img src={hotelIllustration} alt="Hotel Booking" />
          <div className={styles.imageOverlay}>
            <h2>Your Perfect Stay Awaits</h2>
            <p>Begin your journey of comfort and luxury with Solace Stay.</p>
          </div>
        </div>

        <div className={styles.bookingForm}>
          <h2>Reservation Details</h2>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
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
            
            <div className={styles.formGroup}>
              <label>Branch</label>
              <select 
                name="branch" 
                value={formData.branch}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="coorg">Coorg</option>
                <option value="mumbai">Mumbai</option>
                <option value="ahmedabad">Ahmedabad</option>
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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Number of Adults</label>
                <select 
                  name="adults"
                  value={formData.adults}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                >
                  {renderOptions(getMaxGuests(formData.roomType), 1)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Number of Children</label>
                <select 
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {renderOptions(getMaxGuests(formData.roomType) - parseInt(formData.adults))}
                </select>
              </div>
            </div>
            
            {availableRooms.length > 0 && (
              <div className={styles.availabilityInfo}>
                <h3>Available Rooms</h3>
                <div className={styles.availableRoomsList}>
                  {availableRooms.map(room => (
                    <div 
                      key={room.id} 
                      className={`${styles.roomOption} ${selectedRoomId === room.id ? styles.selectedRoom : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div className={styles.roomOptionHeader}>
                        <span className={styles.roomNumber}>{room.roomNumber}</span>
                        <span className={styles.roomPrice}>₹{room.pricePerNight}/night</span>
                      </div>
                      <div className={styles.roomOptionDetails}>
                        <span>{room.roomType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.formDivider}></div>

            <div className={styles.userVerification}>
              <h3>Guest Information</h3>
              <div className={styles.usernameVerification}>
                <div className={styles.formGroup}>
                  <label>Username</label>
                  <div className={styles.usernameInput}>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isSubmitting || userVerified}
                      placeholder="Enter your registered username"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyUser}
                      disabled={isSubmitting || userVerified || !formData.username}
                      className={styles.verifyButton}
                    >
                      {isSubmitting ? 'Verifying...' : userVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>

            {userVerified ? (
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

                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting || availableRooms.length === 0 || !selectedRoomId}
                >
                  {isSubmitting ? 'Processing...' : 'Book Now'}
                </button>
              </>
            ) : (
              <div className={styles.verificationMessage}>
                {userNotFound ? (
                  <div className={styles.notFoundMessage}>
                    <p>User not found. Please verify your username or register first.</p>
                    <button 
                      type="button" 
                      className={styles.registerButton}
                      onClick={() => navigate('/register')}
                    >
                      Register Now
                    </button>
                  </div>
                ) : (
                  <p>Please verify your username to continue with booking</p>
                )}
              </div>
            )}
          </div>
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
