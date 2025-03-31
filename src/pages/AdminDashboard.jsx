import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staff');
  const [staffData, setStaffData] = useState([]);
  const [overallData, setOverallData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalFeedback: 0
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailedData, setDetailedData] = useState({
    bookings: [],
    users: [],
    feedback: [],
    payments: []
  });

  useEffect(() => {
    const checkAdmin = () => {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'));
      if (!adminUser || adminUser.email !== 'Admin.solacestay@gmail.com') {
        navigate('/admin-login');
        return;
      }
    };

    checkAdmin();
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      // Fetch staff data
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      const staffList = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaffData(staffList);

      // Fetch overall data
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
      
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());
      const feedback = feedbackSnapshot.docs.map(doc => doc.data());
      
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      const averageRating = feedback.length > 0 
        ? feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length 
        : 0;

      setOverallData({
        totalBookings: bookings.length,
        totalRevenue,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalFeedback: feedback.length
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchDetailedReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set end date to end of day

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      // Fetch bookings directly with payment information
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure dates are properly formatted
          checkInDate: new Date(data.checkInDate).toISOString(),
          checkOutDate: new Date(data.checkOutDate).toISOString(),
          // Get amount from any available field
          totalAmount: parseFloat(data.totalAmount) || parseFloat(data.price) || parseFloat(data.roomPrice) || 0,
          // Ensure we have payment information
          paymentMethod: data.paymentMethod || 'Online',
          paymentStatus: data.paymentStatus || 'Completed',
          paymentTimestamp: data.bookingDate || data.checkInDate
        };
      });

      // Filter bookings by date range
      const bookings = bookingsData.filter(booking => {
        const bookingDate = new Date(booking.checkInDate);
        return bookingDate >= start && bookingDate <= end;
      });

      console.log('All Bookings:', bookingsData);
      console.log('Filtered Bookings:', bookings);

      if (bookings.length === 0) {
        alert('No bookings found for the selected date range. Please try a different range.');
        setLoading(false);
        return;
      }

      // Process payments directly from bookings
      const payments = bookings
        .filter(booking => booking.totalAmount > 0)
        .map(booking => ({
          id: booking.id,
          bookingId: booking.id,
          timestamp: booking.paymentTimestamp,
          amount: booking.totalAmount,
          paymentMethod: booking.paymentMethod,
          status: booking.paymentStatus,
          guestName: booking.guestName || 
                    (booking.firstName && booking.lastName ? `${booking.firstName} ${booking.lastName}` : 'N/A'),
          roomType: booking.roomType || 'N/A'
        }));

      console.log('Processed Payments:', payments);
      console.log('Date Range:', { 
        start: start.toISOString(), 
        end: end.toISOString(),
        startLocal: start.toLocaleString(),
        endLocal: end.toLocaleString()
      });

      // Fetch all users with their addresses
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Combine all possible address fields
          address: data.address || 
                  data.userAddress || 
                  (data.addressLine1 ? `${data.addressLine1}, ${data.city || ''}, ${data.state || ''}` : '') ||
                  'N/A'
        };
      });

      // Match bookings with user data
      const bookingsWithUsers = bookings.map(booking => {
        const user = usersData.find(u => 
          u.id === booking.userId || 
          u.id === booking.uid || 
          u.email === booking.email
        );

        // Get guest name from all possible sources
        const guestName = 
          (booking.firstName && booking.lastName) ? `${booking.firstName} ${booking.lastName}` :
          (booking.guestName) ? booking.guestName :
          (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` :
          'N/A';

        // Get address from all possible sources
        const address = 
          booking.address || 
          booking.userAddress || 
          user?.address ||
          (booking.addressLine1 ? `${booking.addressLine1}, ${booking.city || ''}, ${booking.state || ''}` : '') ||
          'N/A';

        return {
          ...booking,
          guestName,
          userDetails: {
            name: guestName,
            email: booking.email || user?.email || 'N/A',
            phone: booking.phone || user?.phone || 'N/A',
            address: address
          }
        };
      });

      // Get unique users from bookings
      const uniqueUsers = Array.from(new Set(bookingsWithUsers.map(booking => 
        JSON.stringify(booking.userDetails)
      ))).map(str => JSON.parse(str))
      .filter(user => user.address !== 'N/A' || user.phone !== 'N/A'); // Only include users with either address or phone

      // Fetch feedback within date range
      const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
      const allFeedback = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const feedback = allFeedback.filter(item => {
        const feedbackDate = new Date(item.createdAt || item.timestamp);
        return feedbackDate >= start && feedbackDate <= end;
      });

      setDetailedData({
        bookings: bookingsWithUsers,
        users: uniqueUsers,
        feedback,
        payments
      });

      generatePDF(bookingsWithUsers, uniqueUsers, feedback, payments);
    } catch (error) {
      console.error('Error details:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (bookings, users, feedback, payments) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.text('Solace Stay Hotel - Detailed Report', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, 25, { align: 'center' });

    // Bookings Section
    doc.setFontSize(16);
    doc.text('Bookings', 14, 35);
    const bookingsData = bookings.map(booking => {
      const amount = parseFloat(booking.totalAmount);
      return [
        new Date(booking.checkInDate).toLocaleDateString(),
        booking.roomType || 'N/A',
        booking.guestName || 'N/A',
        new Date(booking.checkInDate).toLocaleDateString(),
        new Date(booking.checkOutDate).toLocaleDateString(),
        amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : '₹0'
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Room Type', 'Guest Name', 'Check In', 'Check Out', 'Amount']],
      body: bookingsData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [128, 0, 32] }
    });

    // Users Section
    doc.addPage();
    doc.text('Guest Information', 14, 15);
    const userData = users
      .filter(user => user.name && user.name !== 'N/A')
      .map(user => [
        user.name,
        user.email || 'N/A',
        user.phone || 'N/A',
        user.address || 'N/A'
      ])
      .filter(row => row[2] !== 'N/A' || row[3] !== 'N/A'); // Only include rows with either phone or address

    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Email', 'Phone', 'Address']],
      body: userData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [128, 0, 32] }
    });

    // Feedback Section
    doc.addPage();
    doc.text('Guest Feedback', 14, 15);
    const feedbackData = feedback.map(item => [
      new Date(item.createdAt || item.timestamp).toLocaleDateString(),
      item.name || 'Anonymous',
      '★'.repeat(parseInt(item.rating || 0)),
      item.feedback || 'N/A'
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Guest Name', 'Rating', 'Feedback']],
      body: feedbackData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [128, 0, 32] }
    });

    // Payments Section
    doc.addPage();
    doc.text('Payment Details', 14, 15);
    const paymentData = payments.map(payment => [
      new Date(payment.timestamp).toLocaleDateString(),
      payment.bookingId,
      payment.paymentMethod,
      `₹${payment.amount.toLocaleString('en-IN')}`,
      payment.status,
      payment.guestName,
      payment.roomType
    ]);

    if (paymentData.length === 0) {
      doc.setFontSize(12);
      doc.text('No payment records found for the selected date range.', 14, 30);
    } else {
      autoTable(doc, {
        startY: 20,
        head: [['Date', 'Booking ID', 'Payment Method', 'Amount', 'Status', 'Guest Name', 'Room Type']],
        body: paymentData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [128, 0, 32] },
        columnStyles: {
          3: { halign: 'right' }, // Align amount to right
          0: { cellWidth: 25 }, // Date column width
          1: { cellWidth: 30 }, // Booking ID column width
          3: { cellWidth: 25 }, // Amount column width
        }
      });
    }

    // Summary Section
    doc.addPage();
    doc.text('Summary', 14, 15);
    const totalRevenue = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    const averageRating = feedback.length > 0
      ? feedback.reduce((sum, item) => sum + (parseInt(item.rating) || 0), 0) / feedback.length
      : 0;

    // Add summary statistics
    doc.setFontSize(12);
    doc.text('Booking Statistics:', 14, 30);
    doc.text(`• Total Bookings: ${bookings.length}`, 20, 40);
    doc.text(`• Most Booked Room: ${getMostBookedRoom(bookings)}`, 20, 50);
    doc.text(`• Average Stay Duration: ${getAverageStayDuration(bookings)} days`, 20, 60);

    doc.text('Financial Statistics:', 14, 80);
    doc.text(`• Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, 20, 90);
    doc.text(`• Average Booking Value: ₹${(totalRevenue / bookings.length || 0).toLocaleString('en-IN')}`, 20, 100);

    doc.text('Guest Feedback:', 14, 120);
    doc.text(`• Total Feedback Received: ${feedback.length}`, 20, 130);
    doc.text(`• Average Rating: ${averageRating.toFixed(1)} ★`, 20, 140);

    // Save the PDF
    doc.save(`solace-stay-report-${startDate}-to-${endDate}.pdf`);
  };

  // Helper functions for summary statistics
  const getMostBookedRoom = (bookings) => {
    const roomCounts = bookings.reduce((acc, booking) => {
      acc[booking.roomType] = (acc[booking.roomType] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  const getAverageStayDuration = (bookings) => {
    const durations = bookings.map(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      return (checkOut - checkIn) / (1000 * 60 * 60 * 24); // Convert to days
    });
    const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    return average.toFixed(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'staff' ? styles.active : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff Data
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'overall' ? styles.active : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Overall Data
        </button>
      </div>

      <div className={styles.contentContainer}>
        {activeTab === 'staff' ? (
          <div className={styles.staffContainer}>
            <h2>Staff Information</h2>
            <div className={styles.staffGrid}>
              {staffData.map(staff => (
                <div key={staff.id} className={styles.staffCard}>
                  <div className={styles.staffHeader}>
                    <h3>{staff.name}</h3>
                    <span className={styles.staffRole}>{staff.role}</span>
                  </div>
                  <div className={styles.staffInfo}>
                    <p><strong>Email:</strong> {staff.email}</p>
                    <p><strong>Phone:</strong> {staff.phone}</p>
                    <p><strong>Department:</strong> {staff.department}</p>
                    <p><strong>Shift:</strong> {staff.shift}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.overallContainer}>
            <h2>Overall Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Total Bookings</h3>
                <p className={styles.statValue}>{overallData.totalBookings}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Total Revenue</h3>
                <p className={styles.statValue}>₹{overallData.totalRevenue.toLocaleString()}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Average Rating</h3>
                <p className={styles.statValue}>{overallData.averageRating} ★</p>
              </div>
              <div className={styles.statCard}>
                <h3>Total Feedback</h3>
                <p className={styles.statValue}>{overallData.totalFeedback}</p>
              </div>
            </div>

            <div className={styles.reportSection}>
              <h3>Generate Detailed Report</h3>
              <div className={styles.dateSelection}>
                <div className={styles.dateInput}>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.dateInput}>
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <button 
                  className={styles.generateButton}
                  onClick={fetchDetailedReport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 