import React, { useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import styles from './HotelBooking.module.css';
import hotelIllustration from '../assets/images/Booking_p.png';
import indianFlag from '../assets/images/india-flag.svg';

const HotelBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoom = location.state?.room || {};
  const servicesRef = useRef(null);
  const storyRef = useRef(null);
  const aboutRef = useRef(null); // Get selected room or fallback to empty object

  const [formData, setFormData] = useState({
    roomType: selectedRoom.name || 'Master Suite', // Default to selected room or 'Master Suite'
    checkInDate: '',
    checkInTime: '13:00',
    checkOutDate: '',
    numberOfGuests: '2',
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    console.log('Form submitted:', formData);
  };
  const isActive = (path) => (location.pathname === path ? styles.activeNavItem : "");


  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <nav className={styles.nav}>
        <ul>
          <li className={isActive("/")} onClick={() => navigate("/")}>HOME</li>
          <li className={isActive("/accommodation")} onClick={() => navigate("/accommodation")}>ACCOMMODATION</li>
          <li className={styles.navItem} onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth" })}>SERVICES</li>
          <li className={styles.navItem} onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}>ABOUT US</li>
          <li className={styles.navItem} onClick={() => aboutRef.current?.scrollIntoView({ behavior: "smooth" })}>CONTACT US</li>
        </ul>
      </nav>

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
          <form onSubmit={handleSubmit}>
            <h2>Reservation Information</h2>
            
            <div className={styles.formGroup}>
              <label>Room type</label>
              <select 
                name="roomType" 
                value={formData.roomType}
                onChange={handleChange}
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
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-in time</label>
                <input
                  type="time"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleChange}
                  min="13:00"
                  max="20:00"
                  step="1800"
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
                />
              </div>
              <div className={styles.formGroup}>
                <label>Number of guests</label>
                <select
                  name="numberOfGuests"
                  value={formData.numberOfGuests}
                  onChange={handleChange}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>A
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
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
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
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton}>
              Request Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HotelBooking;
