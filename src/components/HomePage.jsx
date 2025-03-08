import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './HomePage.module.css';
import homee from '../assets/images/homee.png';
import ourstory from '../assets/images/ourstory.jpg';
import { 
  FaBreadSlice, FaTree, FaSwimmingPool, FaWheelchair, 
  FaSuitcaseRolling, FaCreditCard 
} from "react-icons/fa";
import { 
  MdCleaningServices, MdOutlineRestaurant, MdWifi 
} from "react-icons/md";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const servicesRef = useRef(null);
  const storyRef = useRef(null);
  const aboutRef = useRef(null);

  const handleBookNow = () => {
    navigate('/booking'); 
  };

  const isActive = (path) => location.pathname === path ? styles.activeNavItem : '';

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.hotelInfo}>
            <h1>SOLACE STAY</h1>
            <p>LUXURY & COMFORT</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {/* <button className={styles.phoneButton}>
            <i className="fas fa-phone"></i>
          </button> */}
          <button className={styles.bookNow} onClick={handleBookNow}>
            BOOK NOW
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul>
          <li className={isActive("/")} onClick={() => navigate("/")}>HOME</li>
          <li className={isActive("/accommodation")} onClick={() => navigate("/accommodation")}>ACCOMMODATION</li>
          <li className={styles.navItem} onClick={() => servicesRef.current.scrollIntoView({ behavior: 'smooth' })}>SERVICES</li>
          <li className={styles.navItem} onClick={() => storyRef.current.scrollIntoView({ behavior: 'smooth' })}>ABOUT US</li>
          <li className={styles.navItem} onClick={() => aboutRef.current.scrollIntoView({ behavior: 'smooth' })}>CONTACT US</li>
        </ul>
      </nav>

      {/* Hero Section with Background Image */}
      <section className={styles.hero} style={{ backgroundImage: `url(${homee})` }}>
        <div className={styles.heroContent}>
          <h1>WELCOME TO SOLACE STAY</h1>
          <p>WHERE LUXURY MEETS COMFORT</p>
          <div className={styles.rating}>★★★★★</div>
        </div>
      </section>

      {/* Services Section */}
      <Services ref={servicesRef} />

      {/* Our Story Section */}
      <section ref={storyRef} className={styles.storySection}>
  <h2 className={styles.sectionTitle}>ABOUT US</h2>
  <div className={styles.storyContent}>
    <img src={ourstory} alt="Our Story" className={styles.storyImage} />
    <div className={styles.storyText}>
      <h3>Welcome to Solace Stay: Where Luxury Meets Comfort</h3>
      <p>
        Nestled in breathtaking landscapes, Solace Stay is more than a hotel—it’s an experience of elegance and tranquility. 
        Designed for those who seek beauty and impeccable hospitality, it offers a haven of relaxation.
      </p>

      <h3>Our Story</h3>
      <p>
        Born from a vision to blend luxury with nature, Solace Stay was created by passionate travelers who dreamed of a retreat 
        combining modern comfort with serene surroundings. Inspired by the world’s finest escapes, they crafted a sanctuary 
        where guests can rejuvenate mind, body, and soul.
      </p>

      <h3>The Solace Experience</h3>
      <p>
        From the grand entrance to sunlit corridors and luxurious suites, every detail exudes sophistication. 
        Indulge in gourmet dining, stroll through tranquil gardens, or unwind in cozy lounges. Whether for romance, business, 
        or family retreats, Solace Stay is your perfect escape.
      </p>

      <h3>Discover Your Solace</h3>
      <p>
        Here, hospitality is an art, and every stay is a story. Welcome to Solace Stay—your journey to tranquility begins now.
      </p>
    </div>
  </div>
</section>


      {/* Contact Us Section */}
        <section ref={aboutRef} className={styles.aboutSection}>
          <h2 className={styles.sectionTitle}>CONTACT US</h2>
          <div className={styles.aboutContent}>
            <p>
              At <strong>Solace Stay</strong>, we are dedicated to providing you with an exceptional experience from the moment you reach out to us. 
              Whether you have a question, need assistance with a booking, or simply want to learn more about our offerings, we are here to help.
            </p>
            <p>
              Nestled amidst breathtaking landscapes, our hotel is designed to be a sanctuary of comfort, luxury, and tranquility. 
              We value every guest and strive to make your stay as seamless and memorable as possible.
            </p>
            <p>
              Feel free to contact our friendly team for any inquiries. Whether it’s a special request, travel arrangements, or general information, 
              we are always happy to assist you.
            </p>
            
            <div className={styles.contactDetails}>
              <h3>📍 Visit Us</h3>
              <p>Opp IITB,Powai</p>

              <h3>📞 Call Us</h3>
              <p>+91 9909278787</p>

              <h3>📧 Email Us</h3>
              <p>contact@solacestayluxury.com</p>
            </div>
          </div>
        </section>

    </div>
  );
};

// Services Component
const services = [
  { icon: <FaBreadSlice />, title: "Breakfast" },
  { icon: <FaTree />, title: "Garden" },
  { icon: <FaSwimmingPool />, title: "Pool" },
  { icon: <MdWifi />, title: "Free Wifi" },
  { icon: <MdCleaningServices />, title: "Daily Housekeeping" },
  { icon: <MdOutlineRestaurant />, title: "Dining Service" },
  { icon: <FaWheelchair />, title: "Accessibility" },
  { icon: <FaSuitcaseRolling />, title: "Left Luggage Facilities" },
  { icon: <FaCreditCard />, title: "Cashless Payment" },
];

const Services = React.forwardRef((props, ref) => {
  return (
    <div ref={ref} className={styles.servicesContainer}>
      <h2 className={styles.servicesTitle}>SERVICES</h2>
      <div className={styles.servicesGrid}>
        {services.map((service, index) => (
          <div key={index} className={styles.serviceItem}>
            <span className={styles.serviceIcon}>{service.icon}</span>
            <p className={styles.serviceTitle}>{service.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default HomePage;
