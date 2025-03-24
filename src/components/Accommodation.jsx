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
  const [roomAvailability, setRoomAvailability] = useState({
    "Standard Room": { total: 30, available: 30 }, 
    "Deluxe Room": { total: 25, available: 25 },
    "Master Suite": { total: 25, available: 25 },
    "Honeymoon Suite": { total: 20, available: 20 }
  });

  // Fetch room availability from Firestore
  useEffect(() => {
    const fetchRoomAvailability = async () => {
      try {
        const bookingsRef = collection(db, 'bookings');
        const bookingsSnapshot = await getDocs(query(bookingsRef, where('status', 'in', ['confirmed', 'pending'])));
        
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

        console.log('Booked rooms:', bookedRooms); // Debug log
        
        // Update availability
        const updatedAvailability = {
          "Standard Room": { total: 30, available: Math.max(0, 30 - bookedRooms["Standard Room"]) },
          "Deluxe Room": { total: 25, available: Math.max(0, 25 - bookedRooms["Deluxe Room"]) },
          "Master Suite": { total: 25, available: Math.max(0, 25 - bookedRooms["Master Suite"]) },
          "Honeymoon Suite": { total: 20, available: Math.max(0, 20 - bookedRooms["Honeymoon Suite"]) }
        };

        console.log('Updated availability:', updatedAvailability); // Debug log
        setRoomAvailability(updatedAvailability);
      } catch (error) {
        console.error('Error fetching room availability:', error);
      }
    };

    fetchRoomAvailability();
  }, []);

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
        "Experience ultimate luxury in our Master Suite. This suite offers a spacious king-size bed, an elegant living area, and a deluxe bathroom with a jacuzzi. Enjoy breathtaking city views from your private balcony, making your stay truly unforgettable. Designed for ultimate relaxation, the suite also includes premium furnishings and exclusive in-room services.",
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
                  className={`${styles.bookButton} ${roomAvailability[room.name]?.available === 0 ? styles.disabledButton : ''}`}
                  onClick={() => roomAvailability[room.name]?.available > 0 && navigate("/hotelbooking", { state: { room, availability: roomAvailability[room.name] } })}
                  disabled={roomAvailability[room.name]?.available === 0}
                >
                  {roomAvailability[room.name]?.available === 0 ? 'Fully Booked' : 'Book Now'}
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
