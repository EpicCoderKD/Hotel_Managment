import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './PaymentPage.module.css';
import Header from './Header';
import Footer from './Footer';
import { FaLock, FaCreditCard, FaRegCreditCard, FaExclamationTriangle, FaCalendarAlt, FaShieldAlt, 
  FaMobileAlt, FaUniversity, FaQrcode, FaCheck, FaSpinner, FaDownload } from 'react-icons/fa';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import BookingAlert from './BookingAlert';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import parthupiQR from '../assets/images/Parthupi.jpg';


const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingData, bookingId } = location.state || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Calculate room price (assuming price format is "₹5000/night")
  const roomPrice = bookingData?.roomDetails?.price 
    ? parseInt(bookingData.roomDetails.price.replace(/[^0-9]/g, '')) 
    : 5000;
    
  // Calculate number of nights
  const checkInDate = bookingData?.checkInDate ? new Date(bookingData.checkInDate) : new Date();
  const checkOutDate = bookingData?.checkOutDate ? new Date(bookingData.checkOutDate) : new Date();
  const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
  
  // Calculate taxes and total
  const subtotal = roomPrice * nights;
  const tax = Math.round(subtotal * 0.18); // 18% tax
  const total = subtotal + tax;

  const [formData, setFormData] = useState({
    // Card details
    cardType: '',
    cardCategory: 'debit', // default to debit card
    nameOnCard: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    saveCard: false,
    
    // UPI details
    upiId: '',
    
    // Net Banking details
    bankName: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear errors when field is changed
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
    
    // Format card number with spaces and detect card type
    if (name === 'cardNumber') {
      const cardNumber = value.replace(/\s/g, '');
      if (cardNumber.length <= 16) {
        // Add space after every 4 digits
        const formattedNumber = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        // Auto-detect card type based on patterns
        let detectedCardType = '';
        
        // Visa: Starts with 4
        if (/^4/.test(cardNumber)) {
          detectedCardType = 'visa';
        }
        // Mastercard: Starts with 51-55 or 2221-2720
        else if (/^5[1-5]/.test(cardNumber) || /^(222[1-9]|22[3-9]\d|2[3-6]\d\d|27[0-1]\d|2720)/.test(cardNumber)) {
          detectedCardType = 'mastercard';
        }
        // American Express: Starts with 34 or 37
        else if (/^3[47]/.test(cardNumber)) {
          detectedCardType = 'amex';
        }
        // RuPay: Starts with 60, 6521, 6522, 6523, 6524, 6525, 6526, 6527, 6528
        else if (/^60/.test(cardNumber) || /^652[1-8]/.test(cardNumber)) {
          detectedCardType = 'rupay';
        }
        
        setFormData({
          ...formData,
          cardNumber: formattedNumber,
          cardType: detectedCardType || formData.cardType
        });
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (paymentMethod === 'card') {
      // Validate name on card
      if (!formData.nameOnCard.trim()) {
        errors.nameOnCard = 'Name on card is required';
      }
      
      // Validate card number
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (!cardNumber) {
        errors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(cardNumber)) {
        errors.cardNumber = 'Card number must be 16 digits';
      }
      
      // Validate expiry date
      if (!formData.expiryMonth) {
        errors.expiryMonth = 'Month is required';
      }
      
      if (!formData.expiryYear) {
        errors.expiryYear = 'Year is required';
      }
      
      // Validate CVV
      if (!formData.cvv) {
        errors.cvv = 'CVV is required';
      } else if (!/^\d{3}$/.test(formData.cvv)) {
        errors.cvv = 'CVV must be 3 digits';
      }
    } else if (paymentMethod === 'upi') {
      // Validate UPI ID
      if (!formData.upiId.trim()) {
        errors.upiId = 'UPI ID is required';
      } else if (!/^[\w\.\-]+@[\w\-]+$/.test(formData.upiId)) {
        errors.upiId = 'Please enter a valid UPI ID (e.g. name@upi)';
      }
    } else if (paymentMethod === 'netbanking') {
      // Validate bank selection
      if (!formData.bankName) {
        errors.bankName = 'Please select a bank';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // If bookingId exists, update the booking status in Firestore
      if (bookingId) {
        const bookingRef = doc(db, 'bookings', bookingId);
        
        let paymentDetails;
        
        if (paymentMethod === 'card') {
          paymentDetails = `${formData.cardType} ending in ${formData.cardNumber.slice(-4)}`;
        } else if (paymentMethod === 'upi') {
          paymentDetails = `UPI: ${formData.upiId}`;
        } else if (paymentMethod === 'netbanking') {
          paymentDetails = `Net Banking: ${formData.bankName}`;
        }
        
        await updateDoc(bookingRef, {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentDate: new Date(),
          paymentAmount: total,
          paymentMethod: paymentDetails
        });
      }
      
      setPaymentSuccess(true);
      setShowSuccessAlert(true);
      
      // Navigate after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowSuccessAlert(false);
    navigate('/');
  };

  // Generate array of months
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month < 10 ? `0${month}` : `${month}`, label: month < 10 ? `0${month}` : `${month}` };
  });
  
  // Generate array of years (current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString(), label: year.toString() };
  });

  // List of popular Indian banks for net banking
  const banks = [
    { value: 'SBI', label: 'State Bank of India' },
    { value: 'HDFC', label: 'HDFC Bank' },
    { value: 'ICICI', label: 'ICICI Bank' },
    { value: 'Axis', label: 'Axis Bank' },
    { value: 'PNB', label: 'Punjab National Bank' },
    { value: 'BoB', label: 'Bank of Baroda' },
    { value: 'Kotak', label: 'Kotak Mahindra Bank' },
    { value: 'Yes', label: 'Yes Bank' }
  ];

  // Format a date string for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Generate and download payment receipt
  const generateReceipt = () => {
    const doc = new jsPDF();
    
    // Add Solace Stay logo and header
    doc.setFontSize(22);
    doc.setTextColor(151, 11, 11); // #970b0b
    doc.text('Solace Stay', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Receipt', 105, 30, { align: 'center' });
    
    // Add receipt details
    doc.setFontSize(12);
    doc.text(`Receipt No: ${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 65);
    
    // Add booking details
    doc.setFontSize(14);
    doc.text('Booking Details', 20, 80);
    
    doc.setFontSize(12);
    doc.text(`Guest Name: ${bookingData.firstName} ${bookingData.lastName}`, 20, 90);
    doc.text(`Email: ${bookingData.email}`, 20, 100);
    doc.text(`Room Type: ${bookingData.roomType}`, 20, 110);
    doc.text(`Check-in: ${bookingData.checkInDate}`, 20, 120);
    doc.text(`Check-out: ${bookingData.checkOutDate}`, 20, 130);
    doc.text(`Guests: ${bookingData.adults} Adults, ${bookingData.children} Children`, 20, 140);
    
    // Add payment details
    doc.setFontSize(14);
    doc.text('Payment Details', 20, 160);
    
    doc.setFontSize(12);
    doc.text(`Payment Method: ${paymentMethod === 'card' ? `${formData.cardCategory.charAt(0).toUpperCase() + formData.cardCategory.slice(1)} Card (${formData.cardType.toUpperCase()})` : 
      paymentMethod === 'upi' ? 'UPI' : 
      paymentMethod === 'netbanking' ? `Net Banking (${formData.bankName})` : 'Unknown'}`, 20, 170);
    
    // Add payment summary table
    doc.autoTable({
      startY: 180,
      head: [['Description', 'Amount']],
      body: [
        ['Room Charges', `₹${bookingData.roomPrice}`],
        ['Taxes (18% GST)', `₹${Math.round(bookingData.roomPrice * 0.18)}`],
        ['Total Amount', `₹${bookingData.totalAmount}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [151, 11, 11] },
      margin: { left: 20, right: 20 }
    });
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.text('Thank you for choosing Solace Stay!', 105, pageHeight - 30, { align: 'center' });
    doc.text('For any queries, please contact us at support@solacestay.com', 105, pageHeight - 20, { align: 'center' });
    
    // Save the PDF
    doc.save('Solace_Stay_Payment_Receipt.pdf');
  };

  if (!bookingData && !location.state) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.pageHeader}>
          <h1>Payment Error</h1>
          <p>No booking information found. Please return to booking page.</p>
          <button 
            onClick={() => navigate('/hotelbooking')}
            className={styles.payButton}
            style={{ maxWidth: '300px', margin: '20px auto' }}
          >
            Return to Booking
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.pageHeader}>
        <h1>Complete Your Payment</h1>
        <p>Secure payment process to confirm your reservation</p>
      </div>

      <div className={styles.paymentCard}>
        <div className={styles.leftSection}>
          <h1>BOOKING SUMMARY</h1>
          <p>Review your reservation details before completing payment</p>
          
          <div className={styles.bookingSummary}>
            <h3>Reservation Details</h3>
            <div className={styles.summaryItem}>
              <span>Room Type:</span>
              <span>{bookingData?.roomDetails?.name || 'Standard Room'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Check-in Date:</span>
              <span>{formatDate(bookingData?.checkInDate)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Check-out Date:</span>
              <span>{formatDate(bookingData?.checkOutDate)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Number of Nights:</span>
              <span>{nights}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Number of Guests:</span>
              <span>{bookingData?.numberOfGuests || '2'}</span>
            </div>
            
            <h3>Price Breakdown</h3>
            <div className={styles.summaryItem}>
              <span>Room Rate:</span>
              <span>₹{roomPrice.toLocaleString('en-IN')}/night</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Room Total ({nights} nights):</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>Taxes (18%):</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.total}`}>
              <span>Total Amount:</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.rightSection}>
          {error && (
            <div className={styles.errorMessage}>
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <h2>Payment Details</h2>
            
            <div className={styles.paymentMethodTabs}>
              <button 
                type="button"
                className={`${styles.methodTab} ${paymentMethod === 'card' ? styles.activeTab : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <FaCreditCard /> Credit/Debit Card
              </button>
              <button 
                type="button"
                className={`${styles.methodTab} ${paymentMethod === 'upi' ? styles.activeTab : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <FaQrcode /> UPI
              </button>
              <button 
                type="button"
                className={`${styles.methodTab} ${paymentMethod === 'netbanking' ? styles.activeTab : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <FaUniversity /> Net Banking
              </button>
            </div>
            
            {paymentMethod === 'card' && (
              <div className={styles.cardDetails}>
                <h3><FaCreditCard /> Card Information</h3>
                
                <div className={styles.cardCategorySelector}>
                  <div 
                    className={`${styles.cardCategoryOption} ${formData.cardCategory === 'debit' ? styles.active : ''}`}
                    onClick={() => setFormData({...formData, cardCategory: 'debit'})}
                  >
                    Debit Card
                  </div>
                  <div 
                    className={`${styles.cardCategoryOption} ${formData.cardCategory === 'credit' ? styles.active : ''}`}
                    onClick={() => setFormData({...formData, cardCategory: 'credit'})}
                  >
                    Credit Card
                  </div>
                </div>
                
                <div className={styles.cardTypeIndicator}>
                  {formData.cardType && (
                    <div className={styles.detectedCard}>
                      <span>Detected {formData.cardCategory === 'credit' ? 'Credit' : 'Debit'} Card:</span>
                      <div className={styles.cardLogo}>
                        {formData.cardType === 'visa' && (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                        )}
                        {formData.cardType === 'mastercard' && (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                        )}
                        {formData.cardType === 'amex' && (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="American Express" />
                        )}
                        {formData.cardType === 'rupay' && (
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/RuPay.svg" alt="RuPay" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Name on Card</label>
                  <input
                    type="text"
                    name="nameOnCard"
                    value={formData.nameOnCard}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.nameOnCard && <span className={styles.errorText}>{fieldErrors.nameOnCard}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label>Card Number</label>
                  <div className={styles.cardNumber}>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength="19" // 16 digits + 3 spaces
                      disabled={isSubmitting}
                    />
                    <div className={styles.cardNumberIcon}>
                      <FaRegCreditCard />
                    </div>
                  </div>
                  {fieldErrors.cardNumber && <span className={styles.errorText}>{fieldErrors.cardNumber}</span>}
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label><FaCalendarAlt /> Expiry Date</label>
                    <div className={styles.expiryDate}>
                      <select
                        name="expiryMonth"
                        value={formData.expiryMonth}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">MM</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                      <select
                        name="expiryYear"
                        value={formData.expiryYear}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">YYYY</option>
                        {years.map(year => (
                          <option key={year.value} value={year.value}>{year.label}</option>
                        ))}
                      </select>
                    </div>
                    {(fieldErrors.expiryMonth || fieldErrors.expiryYear) && (
                      <span className={styles.errorText}>Please select a valid expiry date</span>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleChange}
                      placeholder="XXX"
                      maxLength="3"
                      disabled={isSubmitting}
                    />
                    {fieldErrors.cvv && <span className={styles.errorText}>{fieldErrors.cvv}</span>}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      name="saveCard"
                      checked={formData.saveCard}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    Save card for future bookings
                  </label>
                </div>
              </div>
            )}
            
            {paymentMethod === 'upi' && (
              <div className={styles.upiDetails}>
                <h3><FaQrcode /> UPI Payment</h3>
                <div className={styles.upiContent}>
                  <div className={styles.upiQrSection}>
                    <div className={styles.qrPlaceholder}>
                      <img src={parthupiQR} alt="UPI QR Code" className={styles.upiQrCode} />
                      <p>Scan QR with any UPI app</p>
                    </div>
                    <div className={styles.upiAppLinks}>
                      <ul>
                        <li><a href="https://pay.google.com/" target="_blank" rel="noopener noreferrer">Google Pay</a></li>
                        <li><a href="https://paytm.com/" target="_blank" rel="noopener noreferrer">Paytm</a></li>
                        <li><a href="https://www.phonepe.com/" target="_blank" rel="noopener noreferrer">PhonePe</a></li>
                        <li><a href="https://www.bhimupi.org.in/" target="_blank" rel="noopener noreferrer">BHIM</a></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className={styles.upiIdSection}>
                    <p className={styles.orText}>OR</p>
                    
                    <div className={styles.formGroup}>
                      <label>Enter your UPI ID</label>
                      <div className={styles.upiIdInput}>
                        <input
                          type="text"
                          name="upiId"
                          value={formData.upiId}
                          onChange={handleChange}
                          placeholder="yourname@upi"
                          disabled={isSubmitting}
                        />
                        <FaMobileAlt className={styles.upiIcon} />
                      </div>
                      {fieldErrors.upiId && <span className={styles.errorText}>{fieldErrors.upiId}</span>}
                    </div>
                    
                    <p className={styles.upiNoteText}>
                      You will receive a payment request on your UPI app
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {paymentMethod === 'netbanking' && (
              <div className={styles.netBankingDetails}>
                <h3><FaUniversity /> Net Banking</h3>
                
                <div className={styles.popularBanks}>
                  <h4>Popular Banks</h4>
                  <div className={styles.bankOptions}>
                    <div 
                      className={`${styles.bankOption} ${formData.bankName === 'SBI' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, bankName: 'SBI'})}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg" alt="SBI" />
                      <span>SBI</span>
                    </div>
                    <div 
                      className={`${styles.bankOption} ${formData.bankName === 'HDFC' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, bankName: 'HDFC'})}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC" />
                      <span>HDFC</span>
                    </div>
                    <div 
                      className={`${styles.bankOption} ${formData.bankName === 'ICICI' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, bankName: 'ICICI'})}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg" alt="ICICI" />
                      <span>ICICI</span>
                    </div>
                    <div 
                      className={`${styles.bankOption} ${formData.bankName === 'Axis' ? styles.active : ''}`}
                      onClick={() => setFormData({...formData, bankName: 'Axis'})}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg" alt="Axis" />
                      <span>Axis</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.otherBanks}>
                  <h4>Other Banks</h4>
                  <select 
                    name="bankName" 
                    value={formData.bankName} 
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={styles.bankSelect}
                  >
                    <option value="">Select Bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="Axis">Axis Bank</option>
                    <option value="BOB">Bank of Baroda</option>
                    <option value="PNB">Punjab National Bank</option>
                    <option value="Canara">Canara Bank</option>
                    <option value="Union">Union Bank of India</option>
                    <option value="Kotak">Kotak Mahindra Bank</option>
                    <option value="IndusInd">IndusInd Bank</option>
                    <option value="Yes">Yes Bank</option>
                    <option value="IDFC">IDFC First Bank</option>
                  </select>
                  {fieldErrors.bankName && <span className={styles.errorText}>{fieldErrors.bankName}</span>}
                </div>
              </div>
            )}
            
            <button
              type="submit"
              className={styles.payButton}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Processing...' 
                : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
            
            <div className={styles.securePayment}>
              <FaShieldAlt /> Your payment is protected with 256-bit SSL encryption
            </div>
          </form>
        </div>
      </div>
      
      {showSuccessAlert && (
        <BookingAlert 
          bookingId={bookingId}
          bookingData={bookingData}
          onClose={handleCloseAlert}
          isPaymentSuccess={true}
        />
      )}
      
      {paymentSuccess && (
        <div className={styles.successMessage}>
          <FaCheck className={styles.successIcon} />
          <h2>Payment Successful!</h2>
          <p>Your booking has been confirmed. Check your email for details.</p>
          <div className={styles.receiptButton}>
            <button onClick={generateReceipt} className={styles.downloadBtn}>
              <FaDownload /> Download Receipt
            </button>
          </div>
          <button onClick={() => navigate('/')} className={styles.homeButton}>
            Return to Home
          </button>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default PaymentPage;
