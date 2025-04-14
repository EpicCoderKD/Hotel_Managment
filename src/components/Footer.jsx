import React from 'react';
import styles from './Footer.module.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div>
          <h5>About Us</h5>
          <p>Solace Stay offers luxury accommodations with world-class amenities and exceptional service.</p>
        </div>

        <div>
          <h5>Quick Links</h5>
          <ul>
            <li>Home</li>
            <li>Accommodation</li>
            <li>Services</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h5>Contact Info</h5>
          <ul>
            <li><FaMapMarkerAlt className={styles.icon} /> Madikeri, Coorg, India.</li>
            <li><FaPhone className={styles.icon} /> +91 9909278787</li>
            <li><FaEnvelope className={styles.icon} /> contact@solacestayluxury.com</li>
          </ul>
        </div>

        <div>
          <h5>Follow Us</h5>
          <div className={styles['social-icons']}>
            <a 
              href="https://www.facebook.com/solacestay" 
              className={styles['social-link']}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook />
            </a>
            <a 
              href="https://twitter.com/solacestay" 
              className={styles['social-link']}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
            <a 
              href="https://www.instagram.com/solacestay" 
              className={styles['social-link']}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.copyright}>
        <p>&copy; 2025 Solace Stay. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;