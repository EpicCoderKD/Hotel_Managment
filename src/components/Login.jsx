import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import Footer from './Footer';
import Header from './Header';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [userDocId, setUserDocId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    setError('');
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the user document with the new password
      await updateDoc(doc(db, 'users', userDocId), {
        password: newPassword,
        lastUpdated: new Date().toISOString()
      });
      
      // Get the updated user data
      const userRef = doc(db, 'users', userDocId);
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', userDocId)));
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        
        // Login successful
        localStorage.setItem('currentUser', JSON.stringify({
          id: userDocId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName
        }));
        
        // Redirect to accommodation page
        navigate('/accommodation');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setError('An error occurred while setting your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.username || !formData.password) {
        setError('Please enter both username and password');
        setIsSubmitting(false);
        return;
      }

      console.log("Attempting to log in with username:", formData.username);
      
      // Check if user exists in Firestore - use lowercase for username to match how it's stored
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', formData.username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      console.log("Query results:", querySnapshot.empty ? "No results" : `Found ${querySnapshot.size} results`);

      let userDoc;
      let userData;

      if (querySnapshot.empty) {
        // Try searching by email as well in case user entered email instead of username
        const emailQuery = query(usersRef, where('email', '==', formData.username.toLowerCase()));
        const emailQuerySnapshot = await getDocs(emailQuery);
        
        if (emailQuerySnapshot.empty) {
          setError('User not found. Please check your username or register a new account.');
          setIsSubmitting(false);
          return;
        } else {
          // User found by email
          userDoc = emailQuerySnapshot.docs[0];
          userData = userDoc.data();
        }
      } else {
        // User found by username
        userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
      }
      
      console.log("Found user data:", userData.username);

      // Check if password field exists in the user data
      if (!userData.hasOwnProperty('password')) {
        console.log("User data doesn't contain password field:", userData);
        
        // Store the user document ID for password setup
        setUserDocId(userDoc.id);
        
        // Show password setup form
        setShowPasswordSetup(true);
        setIsSubmitting(false);
        return;
      }

      // Verify password
      if (userData.password !== formData.password) {
        setError('Incorrect password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Login successful
      // Store user info in localStorage or sessionStorage
      localStorage.setItem('currentUser', JSON.stringify({
        id: userDoc.id,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName
      }));

      // Redirect to accommodation page
      navigate('/accommodation');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (showPasswordSetup) {
    return (
      <div className={styles.loginPage}>
        <Header />
        <div className={styles.loginContainer}>
          <h2>Set Up Your Password</h2>
          <p>This appears to be your first login. Please set up a password for your account.</p>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSetPassword} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter a new password"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting Password...' : 'Set Password & Login'}
            </button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <Header />
      <div className={styles.loginContainer}>
        <h2>Login to Your Account</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username or email"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className={styles.registerPrompt}>
          <p>Don't have an account?</p>
          <button 
            onClick={handleRegister}
            className={styles.registerButton}
          >
            Register Now
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
