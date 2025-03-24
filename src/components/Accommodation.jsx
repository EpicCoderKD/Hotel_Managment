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
import { collection, getDocs, query, where } from 'firebase/firestore';

const Accommodation = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("coorg");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [roomAvailability, setRoomAvailability] = useState({
    "Standard Room": { total: 30, available: 30 },
    "Deluxe Room": { total: 25, available: 25 },
    "Master Suite": { total: 25, available: 25 },
    "Honeymoon Suite": { total: 20, available: 20 }
  });
  const [availabilityError, setAvailabilityError] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const branches = {
    coorg: {
      name: "Coorg",
      totalRooms: 100,
      rooms: {
        "Standard Room": { total: 30, available: 30 },
        "Deluxe Room": { total: 25, available: 25 },
        "Master Suite": { total: 25, available: 25 },
        "Honeymoon Suite": { total: 20, available: 20 }
      }
    },
    mumbai: {
      name: "Mumbai",
      totalRooms: 80,
      rooms: {
        "Standard Room": { total: 25, available: 25 },
        "Deluxe Room": { total: 20, available: 20 },
        "Master Suite": { total: 20, available: 20 },
        "Honeymoon Suite": { total: 15, available: 15 }
      }
    },
    ahmedabad: {
      name: "Ahmedabad",
      totalRooms: 60,
      rooms: {
        "Standard Room": { total: 20, available: 20 },
        "Deluxe Room": { total: 15, available: 15 },
        "Master Suite": { total: 15, available: 15 },
        "Honeymoon Suite": { total: 10, available: 10 }
      }
    }
  };

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
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(query(
        bookingsRef,
        where('branch', '==', selectedBranch),
        where('roomType', '==', roomType),
        where('status', 'in', ['confirmed', 'pending'])
      ));

      let isAvailable = true;
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

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

      setIsCheckingAvailability(false);
      return isAvailable;
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
          branch: branches[selectedBranch],
          checkInDate,
          checkOutDate
        }
      });
    } else {
      setAvailabilityError("This room is not available for the selected dates");
    }
  };

  // Fetch room availability from Firestore
  useEffect(() => {
    const fetchRoomAvailability = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const bookingsSnapshot = await getDocs(query(
          bookingsRef,
          where('status', 'in', ['confirmed', 'pending']),
          where('branch', '==', selectedBranch)
        ));

        // Count booked rooms by type
        const bookedRooms = {
          "Standard Room": 0,
          "Deluxe Room": 0,
          "Master Suite": 0,
          "Honeymoon Suite": 0
        };

        // Count booked rooms from active bookings
        bookingsSnapshot.forEach((doc) => {
          const booking = doc.data();
          if (booking.roomType) {
            bookedRooms[booking.roomType] = (bookedRooms[booking.roomType] || 0) + 1;
          }
        });

        // Update availability based on selected branch
        const branchRooms = branches[selectedBranch].rooms;
        const updatedAvailability = {
          "Standard Room": {
            total: branchRooms["Standard Room"].total,
            available: Math.max(0, branchRooms["Standard Room"].total - bookedRooms["Standard Room"])
          },
          "Deluxe Room": {
            total: branchRooms["Deluxe Room"].total,
            available: Math.max(0, branchRooms["Deluxe Room"].total - bookedRooms["Deluxe Room"])
          },
          "Master Suite": {
            total: branchRooms["Master Suite"].total,
            available: Math.max(0, branchRooms["Master Suite"].total - bookedRooms["Master Suite"])
          },
          "Honeymoon Suite": {
            total: branchRooms["Honeymoon Suite"].total,
            available: Math.max(0, branchRooms["Honeymoon Suite"].total - bookedRooms["Honeymoon Suite"])
          }
        };

        setRoomAvailability(updatedAvailability);
      } catch (error) {
        console.error('Error fetching room availability:', error);
      }
    };

    fetchRoomAvailability();
  }, [selectedBranch]);

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  const rooms = [
    {
      id: 1,
      name: "Standard Room",
      image: Standard,
      price: "₹3,999/night",
      description:
        "Comfortable and well-designed, our Standard Rooms provide excellent value. Featuring all essential amenities, these rooms are perfect for practical travelers who appreciate quality and comfort at a great price.",
      amenities: [
        "Double Bed",
        "En-suite Bathroom",
        '32" TV',
        "Work Space",
        "Air Conditioning",
        "Daily Housekeeping",
      ],
    },
    {
      id: 2,
      name: "Deluxe Room",
      image: Deluxe,
      price: "₹5,999/night",
      description:
        "Our Deluxe Rooms offer the perfect blend of comfort and style. Each room features a queen-size bed, modern furnishings, and a well-appointed bathroom. Ideal for business travelers or couples seeking quality accommodation.",
      amenities: [
        "Queen Size Bed",
        "City View",
        "Modern Bathroom",
        '43" Smart TV',
        "Work Desk",
        "Tea/Coffee Maker",
      ],
    },
    {
      id: 3,
      name: "Master Suite",
      image: Master,
      price: "₹9,999/night",
      description:
        "Experience ultimate luxury in our Master Suite. This suite offers a spacious king-size bed, an elegant living area, and a deluxe bathroom with a jacuzzi. Enjoy breathtaking city views from your private balcony, making your stay truly unforgettable.",
      amenities: [
        "King-Size Bed",
        "Private Balcony",
        "Luxury Bathroom with Jacuzzi",
        '55" Smart TV',
        "Spacious Living Area",
        "Complimentary Breakfast",
      ],
    },
    {
      id: 4,
      name: "Honeymoon Suite",
      image: Honeymoon,
      price: "₹12,999/night",
      description:
        "Indulge in romance and luxury in our exclusive Honeymoon Suite. Featuring a stunning king-size canopy bed, private balcony, and an elegant marble bathroom. The suite offers breathtaking panoramic views, creating the perfect ambiance for an unforgettable getaway.",
      amenities: [
        "King-Size Canopy Bed",
        "Private Balcony with Panoramic Views",
        "Elegant Marble Bathroom with Spa Tub",
        "Mood Lighting",
        "Premium Champagne Service",
        "Intimate Dining Space",
      ],
    },
  ];

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
            {Object.entries(branches).map(([key, branch]) => (
              <div
                key={key}
                className={`${styles.branchCard} ${selectedBranch === key ? styles.selectedBranch : ''}`}
                onClick={() => setSelectedBranch(key)}
              >
                <h3>{branch.name}</h3>
                <p>Total Rooms: {branch.totalRooms}</p>
                <div className={styles.roomBreakdown}>
                  <p>Standard: {branch.rooms["Standard Room"].total}</p>
                  <p>Deluxe: {branch.rooms["Deluxe Room"].total}</p>
                  <p>Master: {branch.rooms["Master Suite"].total}</p>
                  <p>Honeymoon: {branch.rooms["Honeymoon Suite"].total}</p>
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

        <div className={styles.roomsGrid}>
          {rooms.map((room) => (
            <div key={room.id} className={styles.roomCard}>
              <div className={styles.imageContainer}>
                <img src={room.image} alt={room.name} />
                <span className={styles.price}>{room.price}</span>
                <div className={styles.availabilityBadge}>
                  {roomAvailability[room.name]?.available} / {roomAvailability[room.name]?.total} Available
                </div>
              </div>
              <div className={styles.roomInfo}>
                <h2>{room.name}</h2>
                <p className={styles.description}>{room.description}</p>
                <div className={styles.amenities}>
                  <h3>Room Amenities</h3>
                  <ul>
                    {room.amenities.map((amenity, index) => (
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
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Accommodation;
