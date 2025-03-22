import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBookNow = () => {
    navigate("/accommodation");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleScrollTo = (sectionId) => {
    // If we're on the homepage, scroll to the section
    if (location.pathname === '/') {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If we're on another page, navigate to the homepage with the section hash
      navigate(`/#${sectionId}`);
    }
  };

  const isActive = (path) => (location.pathname === path ? styles.activeNavItem : "");

  return (
    <header className={styles.header}>
      {/* Top Section: Logo & Button */}
      <div className={styles.headerTop}>
        <div className={styles.logoContainer} onClick={() => navigate("/")}>
          <h1 className={styles.logo}>SOLACE STAY</h1>
          <p className={styles.tagline}>Luxury & Comfort</p>
        </div>
        <div className={styles.buttonContainer}>
          <button className={styles.registerButton} onClick={handleRegister}>
            REGISTER
          </button>
          <button className={styles.bookNow} onClick={handleLogin}>
            LOGIN
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className={styles.nav}>
        <ul>
          <li className={isActive("/")} onClick={() => navigate("/")}>Home</li>
          <li className={isActive("/accommodation")} onClick={() => navigate("/accommodation")}>Accommodation</li>
          <li onClick={() => handleScrollTo("services")}>Services</li>
          <li onClick={() => handleScrollTo("about")}>About Us</li>
          <li onClick={() => handleScrollTo("contact")}>Contact Us</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
