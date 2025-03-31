import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
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
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2>Admin Login</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
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
        <div className={styles.backLink}>
          <button onClick={() => navigate('/login')} className={styles.backButton}>
            Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 