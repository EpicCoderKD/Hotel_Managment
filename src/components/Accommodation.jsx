import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Accommodation.module.css";
import Standard from "../assets/images/Standard.jpg";
import Deluxe from "../assets/images/Deluxe.jpg";
import Master from "../assets/images/Master_Suite.jpg";
import Honeymoon from "../assets/images/honeymoon-suite.jpg";
import Footer from './Footer';
import Header from './Header';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const Accommodation = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("coorg");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchData, setBranchData] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomAvailability, setRoomAvailability] = useState({});
  const [availabilityError, setAvailabilityError] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch branches from Firebase
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        const branchesSnapshot = await getDocs(branchesRef);
        const branchesData = branchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBranches(branchesData);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, []);

  // Fetch selected branch data
  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        setIsLoading(true);
        const branchRef = doc(db, 'branches', selectedBranch);
        const branchSnapshot = await getDoc(branchRef);
        
        if (branchSnapshot.exists()) {
          const data = branchSnapshot.data();
          setBranchData(data);
          
          // Convert room types object to array
          const roomTypesArray = Object.entries(data.roomTypes).map(([name, details]) => ({
            id: name,
            name,
            ...details
          }));
          
          setRoomTypes(roomTypesArray);
        } else {
          console.error('No branch found with ID:', selectedBranch);
        }
      } catch (error) {
        console.error('Error fetching branch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedBranch) {
      fetchBranchData();
    }
  }, [selectedBranch]);

  // Fetch room availability from Firebase rooms collection
  useEffect(() => {
    const fetchRoomAvailability = async () => {
      try {
        setIsLoading(true);
        
        // Query rooms collection for this branch
        const roomsRef = collection(db, 'rooms');
        const roomsQuery = query(
          roomsRef,
          where('branch', '==', selectedBranch)
        );
        const roomsSnapshot = await getDocs(roomsQuery);
        
        // Count available rooms by type
        const availability = {};
        roomsSnapshot.forEach((doc) => {
          const room = doc.data();
          
          if (!availability[room.roomType]) {
            availability[room.roomType] = {
              total: 0,
              available: 0
            };
          }
          
          availability[room.roomType].total += 1;
          
          if (room.isAvailable && !room.isBooked) {
            availability[room.roomType].available += 1;
          }
        });
        
        setRoomAvailability(availability);
      } catch (error) {
        console.error('Error fetching room availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedBranch) {
      fetchRoomAvailability();
    }
  }, [selectedBranch]);

  // Check room availability for selected dates
  const checkRoomAvailability = async (roomType) => {
    if (!checkInDate || !checkOutDate) {
      setAvailabilityError("Please select both check-in and check-out dates");
      return false;
    }

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    if (inDate >= outDate) {
      setAvailabilityError("Check-out date must be after check-in date");
      return false;
    }

    setIsCheckingAvailability(true);
    setAvailabilityError("");

    try {
      // Query rooms collection for available rooms of the specified type
      const roomsRef = collection(db, 'rooms');
      const roomsQuery = query(
        roomsRef,
        where('branch', '==', selectedBranch),
        where('roomType', '==', roomType),
        where('isAvailable', '==', true),
        where('isBooked', '==', false)
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      
      // Check if we have any available rooms
      const availableRooms = roomsSnapshot.docs.map(doc => doc.data());
      
      // Now check if any of these rooms have overlapping bookings
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsRef,
        where('branch', '==', selectedBranch),
        where('roomType', '==', roomType),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());
      
      // Check date overlap for each available room
      const roomsWithNoOverlap = availableRooms.filter(room => {
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
      
      setIsCheckingAvailability(false);
      return roomsWithNoOverlap.length > 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError("Error checking room availability");
      setIsCheckingAvailability(false);
      return false;
    }
  };

  // Handle booking button click
  const handleBookingClick = async (room) => {
    const isAvailable = await checkRoomAvailability(room.name);
    
    if (isAvailable) {
      navigate("/hotelbooking", {
        state: {
          room,
          availability: roomAvailability[room.name],
          branch: selectedBranch,
          branchName: branchData?.name || selectedBranch,
          checkInDate,
          checkOutDate
        }
      });
    } else {
      setAvailabilityError("This room is not available for the selected dates");
    }
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  // Get room image based on room type
  const getRoomImage = (roomType) => {
    switch (roomType) {
      case 'Standard Room':
        return Standard;
      case 'Deluxe Room':
        return Deluxe;
      case 'Master Suite':
        return Master;
      case 'Honeymoon Suite':
        return Honeymoon;
      default:
        return Standard;
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.contentContainer}>
        <header className={styles.pageHeader}>
          <h1>Accommodation</h1>
          <p>Choose your perfect stay at Solace Stay</p>
        </header>

        {/* Branch Selection Section */}
        <div className={styles.branchSelection}>
          <h2>Select Your Branch</h2>
          <div className={styles.branchCards}>
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={`${styles.branchCard} ${selectedBranch === branch.id ? styles.selectedBranch : ''}`}
                onClick={() => setSelectedBranch(branch.id)}
              >
                <h3>{branch.name}</h3>
                <div className={styles.branchDetails}>
                  <p>{branch.location.city}, {branch.location.state}</p>
                  <span className={styles.branchRating}>{branch.rating} ★</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection Section */}
        <div className={styles.dateSelection}>
          <h2>Select Your Stay Dates</h2>
          <div className={styles.datePickerContainer}>
            <div className={styles.datePickerWrapper}>
              <label htmlFor="checkin">Check-in Date</label>
              <input
                id="checkin"
                type="date"
                className={styles.datePicker}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={today}
                required
              />
            </div>
            <div className={styles.datePickerWrapper}>
              <label htmlFor="checkout">Check-out Date</label>
              <input
                id="checkout"
                type="date"
                className={styles.datePicker}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || today}
                required
              />
            </div>
          </div>
          {availabilityError && (
            <div className={styles.errorMessage}>
              {availabilityError}
            </div>
          )}
        </div>

        {branchData && (
          <div className={styles.branchInfo}>
            <h2>{branchData.name} Branch</h2>
            <div className={styles.branchAmenities}>
              <h3>Branch Amenities</h3>
              <ul className={styles.amenitiesList}>
                {branchData.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
            </div>
            <div className={styles.contactInfo}>
              <p><strong>Address:</strong> {branchData.location.address}, {branchData.location.city}, {branchData.location.state} {branchData.location.zipCode}</p>
              <p><strong>Contact:</strong> {branchData.contactInfo.phone} | {branchData.contactInfo.email}</p>
            </div>
          </div>
        )}

        <div className={styles.roomsGrid}>
          {isLoading ? (
            <div className={styles.loading}>Loading rooms...</div>
          ) : (
            roomTypes.map((room) => (
              <div key={room.id} className={styles.roomCard}>
                <div className={styles.imageContainer}>
                  <img src={getRoomImage(room.name)} alt={room.name} />
                  <span className={styles.price}>₹{room.pricePerNight}/night</span>
                  <div className={styles.availabilityBadge}>
                    {roomAvailability[room.name]?.available} / {roomAvailability[room.name]?.total} Available
                  </div>
                </div>
                <div className={styles.roomInfo}>
                  <h2>{room.name}</h2>
                  <div className={styles.roomStats}>
                    <span>Max Guests: {room.maxGuests}</span>
                    <span>Size: {room.roomSize}</span>
                    <span>Bed: {room.bedType}</span>
                  </div>
                  <p className={styles.description}>{room.description}</p>
                  <div className={styles.amenities}>
                    <h3>Room Amenities</h3>
                    <ul>
                      {room.amenities?.map((amenity, index) => (
                        <li key={index}>{amenity}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className={`${styles.bookButton} ${(roomAvailability[room.name]?.available === 0 || isCheckingAvailability) ? styles.disabledButton : ''}`}
                    onClick={() => handleBookingClick(room)}
                    disabled={roomAvailability[room.name]?.available === 0 || isCheckingAvailability}
                  >
                    {isCheckingAvailability ? 'Checking Availability...' : 
                     roomAvailability[room.name]?.available === 0 ? 'Fully Booked' : 'Book Now'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Accommodation;
