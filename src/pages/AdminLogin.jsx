import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check for admin credentials
      if (email === 'Admin.solacestay@gmail.com' && password === 'Kathan@0611') {
        // Store admin session
        localStorage.setItem('adminUser', JSON.stringify({
          email: email,
          isAdmin: true
        }));
        
        navigate('/admin-dashboard');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (error) {
      setError('Error during login. Please try again.');
    }
  };

  return (
    <div className={styles.adminLoginContainer}>
      <div className={styles.adminLoginBox}>
        <h2>Admin Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.loginButton}>
            Login as Admin
          </button>
        </form>
        <p className={styles.backLink}>
          <button onClick={() => navigate('/login')} className={styles.backButton}>
            Back to User Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin; 