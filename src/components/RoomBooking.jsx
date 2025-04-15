import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getRoomPrice, checkRoomAvailability } from '../utils/roomUtils';
import styles from './RoomBooking.module.css';

const RoomBooking = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    branchName: '',
    roomType: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomPrice, setRoomPrice] = useState(0);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);

  const branches = ['Mumbai', 'Coorg', 'Ahmedabad'];
  const roomTypes = ['Standard', 'Deluxe', 'Master', 'Honeymoon'];

  const checkAvailability = async () => {
    if (!formData.branchName || !formData.roomType || !formData.checkInDate || !formData.checkOutDate) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const availability = await checkRoomAvailability(
        formData.branchName,
        formData.roomType,
        formData.checkInDate,
        formData.checkOutDate
      );

      setAvailabilityInfo(availability);
      if (!availability.isAvailable) {
        setError(`No rooms available for the selected dates. Only ${availability.availableRooms} rooms left out of ${availability.totalRooms}.`);
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError(err.message || 'Error checking room availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [formData.checkInDate, formData.checkOutDate, formData.branchName, formData.roomType]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if ((name === 'branchName' || name === 'roomType') && formData.branchName && formData.roomType) {
      try {
        setLoading(true);
        const price = await getRoomPrice(
          name === 'branchName' ? value : formData.branchName,
          name === 'roomType' ? value : formData.roomType
        );
        setRoomPrice(price);
        setError('');
      } catch (error) {
        console.error('Error getting room price:', error);
        setError(error.message || 'Error fetching room price. Please try again.');
        setRoomPrice(0);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to book a room');
      navigate('/login');
      return;
    }

    if (!availabilityInfo?.isAvailable) {
      setError('This room is not available for the selected dates.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Validate dates
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Calculate total amount
      const nights = Math.ceil(
        (checkOut - checkIn) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = roomPrice * nights;

      // Create booking
      const bookingData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        ...formData,
        totalAmount,
        status: 'confirmed',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Navigate to payment page
      navigate(`/payment/${bookingRef.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bookingContainer}>
      <h2>Book a Room</h2>
      
      <form onSubmit={handleSubmit} className={styles.bookingForm}>
        <div className={styles.formGroup}>
          <label>Branch:</label>
          <select
            name="branchName"
            value={formData.branchName}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Branch</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Room Type:</label>
          <select
            name="roomType"
            value={formData.roomType}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Room Type</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Check-in Date:</label>
          <input
            type="date"
            name="checkInDate"
            value={formData.checkInDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Check-out Date:</label>
          <input
            type="date"
            name="checkOutDate"
            value={formData.checkOutDate}
            onChange={handleInputChange}
            min={formData.checkInDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Number of Guests:</label>
          <input
            type="number"
            name="numberOfGuests"
            value={formData.numberOfGuests}
            onChange={handleInputChange}
            min="1"
            max="4"
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {roomPrice > 0 && (
          <div className={styles.priceInfo}>
            <p>Price per Night: ₹{roomPrice.toLocaleString('en-IN')}</p>
            {formData.checkInDate && formData.checkOutDate && (
              <p>Total Nights: {Math.ceil(
                (new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24)
              )}</p>
            )}
            {availabilityInfo?.isAvailable && (
              <p className={styles.availabilityStatus}>
                Room is available! ({availabilityInfo.availableRooms} of {availabilityInfo.totalRooms} rooms free)
              </p>
            )}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading || !availabilityInfo?.isAvailable}
        >
          {loading ? 'Processing...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
};

export default RoomBooking;