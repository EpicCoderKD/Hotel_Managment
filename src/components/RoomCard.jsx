import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RoomCard.module.css';

const RoomCard = ({ room, branch }) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate('/booking', {
      state: {
        selectedRoom: {
          type: room.roomType,
          price: room.pricePerNight
        },
        selectedBranch: {
          name: branch || room.branchName
        }
      }
    });
  };

  return (
    <div className={styles.roomCard}>
      <div className={styles.roomImage}>
        <img src={room.image} alt={room.roomType} />
      </div>
      <div className={styles.roomInfo}>
        <h3>{room.roomType}</h3>
        <p className={styles.price}>₹{room.pricePerNight.toLocaleString('en-IN')} / night</p>
        <p className={styles.description}>{room.description}</p>
        <div className={styles.amenities}>
          {room.amenities?.map((amenity, index) => (
            <span key={index} className={styles.amenity}>{amenity}</span>
          ))}
        </div>
        <button 
          className={styles.bookButton}
          onClick={handleBookNow}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default RoomCard; 