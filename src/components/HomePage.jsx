import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './HomePage.module.css';
import homee from '../assets/images/homee.png';
import ourstory from '../assets/images/ourstory.jpg';
import { FaBreadSlice, FaTree, FaSwimmingPool, FaWheelchair, FaSuitcaseRolling, FaCreditCard } from "react-icons/fa";
import { MdCleaningServices, MdOutlineRestaurant, MdWifi } from "react-icons/md";
import Footer from './Footer';
import Header from './Header'; // Import Header Component

const HomePage = () => {
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Handle direct navigation with hash
    if (location.hash) {
      const sectionId = location.hash.substring(1);
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [location]);

  return (
    <div className={styles.container}>
      <Header /> {/* Use Header Component */}

      {/* Hero Section */}
      <section className={styles.hero} style={{ backgroundImage: `url(${homee})` }}>
        <div className={styles.heroContent}>
          <h1>WELCOME TO SOLACE STAY</h1>
          <p>WHERE LUXURY MEETS COMFORT</p>
          <div className={styles.rating}>★★★★★</div>
        </div>
      </section>

      {/* Services Section */}
      <Services ref={servicesRef} id="services" />

      {/* Our Story Section */}
      <section ref={aboutRef} id="about" className={styles.storySection}>
        <h2 className={styles.sectionTitle}>ABOUT US</h2>
        <div className={styles.storyContent}>
          <img src={ourstory} alt="Our Story" className={styles.storyImage} />
          <div className={styles.storyText}>
            <h3>Welcome to Solace Stay: Where Luxury Meets Comfort</h3>
            <p>
              Nestled in breathtaking landscapes, Solace Stay is more than a hotel—it's an experience of elegance and tranquility. 
            </p>
            <h3>Our Story</h3>
            <p>
              Born from a vision to blend luxury with nature, Solace Stay was created by passionate travelers who dreamed of a retreat.
            </p>
            <h3>The Solace Experience</h3>
            <p>
              From the grand entrance to sunlit corridors and luxurious suites, every detail exudes sophistication.
            </p>
            <h3>Discover Your Solace</h3>
            <p>
              Here, hospitality is an art, and every stay is a story. Welcome to Solace Stay—your journey to tranquility begins now.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section ref={contactRef} id="contact" className={styles.aboutSection}>
        <h2 className={styles.sectionTitle}>CONTACT US</h2>
        <div className={styles.aboutContent}>
          <p>
            At <strong>Solace Stay</strong>, we are dedicated to providing you with an exceptional experience from the moment you reach out to us.
          </p>
          <p>
            Feel free to contact our friendly team for any inquiries. Whether it's a special request, travel arrangements, or general information, we are always happy to assist you.
          </p>
          <div className={styles.contactDetails}>
            <h3>📍 Visit Us</h3>
            <p>Madikeri, Coorg, India.</p>
            <h3>📞 Call Us</h3>
            <p>+91 9909278787</p>
            <h3>📧 Email Us</h3>
            <p>contact@solacestayluxury.com</p>
          </div>
        </div>
      </section>

      <Footer />
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

const Services = React.forwardRef(({ id }, ref) => (
  <div ref={ref} id={id} className={styles.servicesContainer}>
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
));

export default HomePage;
