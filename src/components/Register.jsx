import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import { db } from '../firebase';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Footer from './Footer';
import Header from './Header';

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);

  // Add validateIdNumber function
  const validateIdNumber = (type, number) => {
    if (!type) return 'Please select an ID type first';
    if (!number) return 'ID Number is required';
    
    switch (type) {
      case 'aadhaar':
        // Aadhaar: exactly 12 digits
        return /^\d{12}$/.test(number) ? '' : 'Aadhaar number must be exactly 12 digits';
      case 'passport':
      case 'drivingLicense':
        // Passport and Driving License: exactly 13 characters (alphanumeric)
        return /^[A-Z0-9]{13}$/.test(number.toUpperCase()) 
          ? '' 
          : 'ID number must be exactly 13 characters (letters and numbers)';
      default:
        return 'Invalid ID type';
    }
  };

  const [formData, setFormData] = useState({
    // Personal Information
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    zipCode: '',
    
    // Identity Verification
    idType: '',
    idNumber: '',

    // Account Security & Preferences
    username: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'English',
    newsletterSubscription: false,
    termsAccepted: false
  });

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) 
          ? 'Please enter a valid email address' 
          : '';
      case 'username':
        // Basic validation first
        if (!value) return 'Username is required';
        if (value.length < 4) return 'Username must be at least 4 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers and underscores';
        return '';
      case 'phone':
        // First, clean the phone number to remove any non-digits
        const cleanedPhone = value.replace(/\D/g, '');
        if (cleanedPhone.length !== 10) {
          return 'Phone number must be exactly 10 digits';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        return value !== formData.password 
          ? 'Passwords do not match' 
          : '';
      case 'termsAccepted':
        return !value ? 'You must accept the terms and conditions' : '';
      case 'idNumber':
        return validateIdNumber(formData.idType, value);
      case 'city':
      case 'zipCode':
        return !value || value.trim() === '' ? `${name.charAt(0).toUpperCase() + name.slice(1)} is required` : '';
      default:
        return !value || value.trim() === '' ? `${name.charAt(0).toUpperCase() + name.slice(1)} is required` : '';
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let text = '';

    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    switch (strength) {
      case 0:
      case 1:
        text = 'Very Weak';
        break;
      case 2:
        text = 'Weak';
        break;
      case 3:
        text = 'Medium';
        break;
      case 4:
        text = 'Strong';
        break;
      case 5:
        text = 'Very Strong';
        break;
      default:
        text = '';
    }

    setPasswordStrength(strength);
    setPasswordStrengthText(text);
  };

  const checkUsernameUniqueness = async (username) => {
    if (!username || username.length < 4) return;
    
    setIsCheckingUsername(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      setIsUsernameAvailable(querySnapshot.empty);
      if (!querySnapshot.empty) {
        setFieldErrors(prev => ({
          ...prev,
          username: 'This username is already taken'
        }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.username === 'This username is already taken') {
            delete newErrors.username;
          }
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for phone field to clean input
    if (name === 'phone') {
      // Only allow digits
      const onlyDigits = value.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = onlyDigits.slice(0, 10);
      
      setFormData({
        ...formData,
        [name]: limitedDigits
      });
      
      // Clear field error as user types
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      
      return;
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Calculate password strength when password changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    // Check username uniqueness with debounce
    if (name === 'username') {
      // Clear any existing timers
      if (window.usernameTimer) {
        clearTimeout(window.usernameTimer);
      }
      
      // Set a new timer to check username after 500ms of no typing
      window.usernameTimer = setTimeout(() => {
        checkUsernameUniqueness(value);
      }, 500);
    }
    
    // Clear field error as user types
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1:
        ['title', 'firstName', 'lastName', 'email', 'phone', 'city', 'zipCode'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) errors[field] = error;
        });
        break;
      case 2:
        ['idType', 'idNumber'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) errors[field] = error;
        });
        break;
      case 3:
        // Validate required fields
        ['username', 'password', 'confirmPassword', 'preferredLanguage'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) errors[field] = error;
        });
        
        // Special validation for terms acceptance
        if (!formData.termsAccepted) {
          errors.termsAccepted = 'You must accept the terms and conditions';
        }
        
        // Additional password validation
        if (!errors.password && !errors.confirmPassword) {
          if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          }
        }
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // Collect all validation errors for current step
    const errors = {};
    let fieldsToValidate = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'firstName', 'lastName', 'email', 'phone', 'city', 'zipCode'];
        break;
      case 2:
        fieldsToValidate = ['idType', 'idNumber'];
        break;
      case 3:
        fieldsToValidate = ['username', 'password', 'confirmPassword', 'preferredLanguage'];
        if (!formData.termsAccepted) {
          errors.termsAccepted = 'You must accept the terms and conditions';
        }
        break;
    }

    // Validate each field
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    // Update field errors
    setFieldErrors(errors);
    
    // Log errors for debugging
    console.log('Validation errors:', errors);
    
    // Check if there are any errors
    if (Object.keys(errors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError('');
    } else {
      // Show specific error message
      const errorMessage = `Please correct the following errors: ${Object.values(errors)[0]}`;
      setError(errorMessage);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log("Form submission attempted. Current data:", formData);

    // Check if username is unique
    if (formData.username) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', formData.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setFieldErrors(prev => ({
          ...prev,
          username: 'This username is already taken'
        }));
        setError('Please choose a different username as this one is already taken.');
        return;
      }
    }

    // Validate all fields one final time
    const errors = {};
    const allFields = [
      // Personal Info
      'title', 'firstName', 'lastName', 'email', 'phone', 'city', 'zipCode',
      // Identity
      'idType', 'idNumber',
      // Security
      'password', 'confirmPassword', 'preferredLanguage'
    ];

    // Check all fields
    allFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    // Special check for terms
    if (!formData.termsAccepted) {
      errors.termsAccepted = 'You must accept the terms and conditions';
    }

    // If there are any errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const errorMessages = Object.values(errors);
      console.log("Validation errors during submission:", errors);
      setError(`Please fix the following issues: ${errorMessages[0]}`);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Form validation successful, proceeding with submission");
      const documentId = formData.email.toLowerCase();
      
      // Create a new object with only the fields we want to store
      const userData = {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.toLowerCase(),
        email: formData.email.toLowerCase(),
        password: formData.password,
        phone: formData.phone,
        city: formData.city,
        zipCode: formData.zipCode,
        idType: formData.idType,
        idNumber: formData.idNumber,
        preferredLanguage: formData.preferredLanguage,
        newsletterSubscription: formData.newsletterSubscription,
        termsAccepted: formData.termsAccepted,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'active'
      };

      console.log("About to save data to Firestore:", userData);
      await setDoc(doc(db, 'users', documentId), userData);
      console.log("Data saved successfully!");
      alert('Account created successfully! Redirecting to home page...');
      navigate('/');
    } catch (error) {
      console.error('Error registering user:', error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.formSection}>
            <h2>Personal Information</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <select name="title" value={formData.title} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${fieldErrors.email ? styles.hasError : ''}`}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.email && <div className={styles.errorText}>{fieldErrors.email}</div>}
              </div>

              <div className={`${styles.formGroup} ${fieldErrors.phone ? styles.hasError : ''}`}>
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10 digit number"
                  required
                />
                {fieldErrors.phone && <div className={styles.errorText}>{fieldErrors.phone}</div>}
                <div className={styles.fieldHint}>Phone number must be exactly 10 digits (digits only, no spaces or special characters)</div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${fieldErrors.city ? styles.hasError : ''}`}>
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.city && <div className={styles.errorText}>{fieldErrors.city}</div>}
              </div>

              <div className={`${styles.formGroup} ${fieldErrors.zipCode ? styles.hasError : ''}`}>
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.zipCode && <div className={styles.errorText}>{fieldErrors.zipCode}</div>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.formSection}>
            <h2>Identity Verification</h2>
            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${fieldErrors.idType ? styles.hasError : ''}`}>
                <label>ID Type</label>
                <select 
                  name="idType" 
                  value={formData.idType} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Select ID Type</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="drivingLicense">Driving License</option>
                </select>
                {fieldErrors.idType && <div className={styles.errorText}>{fieldErrors.idType}</div>}
              </div>

              <div className={`${styles.formGroup} ${fieldErrors.idNumber ? styles.hasError : ''}`}>
                <label>ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => {
                    // Clean input based on ID type
                    let value = e.target.value;
                    if (formData.idType === 'aadhaar') {
                      // Only allow digits for Aadhaar
                      value = value.replace(/\D/g, '').slice(0, 12);
                    } else {
                      // Allow letters and numbers for passport/license, convert to uppercase
                      value = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 13).toUpperCase();
                    }
                    setFormData(prev => ({
                      ...prev,
                      idNumber: value
                    }));
                  }}
                  required
                  placeholder={
                    formData.idType === 'aadhaar' 
                      ? "Enter 12 digit Aadhaar number" 
                      : formData.idType === 'passport' 
                        ? "Enter 13 character Passport number"
                        : formData.idType === 'drivingLicense'
                          ? "Enter 13 character License number"
                          : "Select ID type first"
                  }
                />
                {fieldErrors.idNumber && <div className={styles.errorText}>{fieldErrors.idNumber}</div>}
                <div className={styles.fieldHint}>
                  {formData.idType === 'aadhaar' && (
                    "Aadhaar number must be exactly 12 digits"
                  )}
                  {(formData.idType === 'passport' || formData.idType === 'drivingLicense') && (
                    "ID number must be exactly 13 characters (letters and numbers allowed)"
                  )}
                </div>
                {formData.idNumber && (
                  <div className={`${styles.idValidation} ${
                    validateIdNumber(formData.idType, formData.idNumber) ? styles.invalid : styles.valid
                  }`}>
                    {validateIdNumber(formData.idType, formData.idNumber) || '✓ Valid ID format'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.formSection}>
            <h2>Account Security & Preferences</h2>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${fieldErrors.username ? styles.hasError : ''}`}>
                <label>Username</label>
                <div className={styles.usernameInputContainer}>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Choose a unique username"
                  />
                  {formData.username && formData.username.length >= 4 && (
                    <div className={styles.usernameStatus}>
                      {isCheckingUsername ? (
                        <span className={styles.checking}>Checking...</span>
                      ) : isUsernameAvailable ? (
                        <span className={styles.available}>✓ Available</span>
                      ) : (
                        <span className={styles.unavailable}>✗ Already taken</span>
                      )}
                    </div>
                  )}
                </div>
                {fieldErrors.username && <div className={styles.errorText}>{fieldErrors.username}</div>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${fieldErrors.password ? styles.hasError : ''}`}>
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {passwordStrength > 0 && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div 
                        className={`${styles.strengthFill} ${styles[`strength${passwordStrength}`]}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={styles.strengthText}>{passwordStrengthText}</span>
                  </div>
                )}
                {fieldErrors.password && <div className={styles.errorText}>{fieldErrors.password}</div>}
              </div>

              <div className={`${styles.formGroup} ${fieldErrors.confirmPassword ? styles.hasError : ''}`}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.confirmPassword && <div className={styles.errorText}>{fieldErrors.confirmPassword}</div>}
              </div>
            </div>

            <div className={`${styles.formGroup} ${fieldErrors.preferredLanguage ? styles.hasError : ''}`}>
              <label>Preferred Language</label>
              <select 
                name="preferredLanguage" 
                value={formData.preferredLanguage} 
                onChange={handleChange}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Gujarati">Gujarati</option>
              </select>
              {fieldErrors.preferredLanguage && <div className={styles.errorText}>{fieldErrors.preferredLanguage}</div>}
            </div>

            <div className={`${styles.checkboxGroup} ${fieldErrors.newsletterSubscription ? styles.hasError : ''}`}>
              <label>
                <input
                  type="checkbox"
                  name="newsletterSubscription"
                  checked={formData.newsletterSubscription}
                  onChange={handleChange}
                />
                <span>Subscribe to our newsletter for exclusive offers and updates</span>
              </label>
            </div>

            <div className={`${styles.checkboxGroup} ${fieldErrors.termsAccepted ? styles.hasError : ''}`}>
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the Terms & Conditions and Privacy Policy</span>
              </label>
              {fieldErrors.termsAccepted && <div className={styles.errorText}>{fieldErrors.termsAccepted}</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.formContainer}>
        <h1>Create Your Account</h1>
        <p className={styles.subtitle}>Join Solace Stay for exclusive benefits and seamless booking experience</p>

        {/* Progress tracker with clear separation */}
        <div className={styles.progressTracker}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressStep} 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
            <div className={styles.stepIndicators}>
              <div 
                className={`${styles.stepIndicator} ${currentStep >= 1 ? styles.active : ''}`}
                data-step="Personal Info"
              >1</div>
              <div 
                className={`${styles.stepIndicator} ${currentStep >= 2 ? styles.active : ''}`}
                data-step="Identity"
              >2</div>
              <div 
                className={`${styles.stepIndicator} ${currentStep >= 3 ? styles.active : ''}`}
                data-step="Security"
              >3</div>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.registrationForm}>
            {renderStep()}

            <div className={styles.buttonGroup}>
              {currentStep > 1 && (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNext}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default Register;