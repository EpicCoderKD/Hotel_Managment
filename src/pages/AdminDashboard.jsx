import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './AdminDashboard.module.css';
import { initializeStaffData } from '../utils/initializeStaffData';

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
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSalary, setEditedSalary] = useState('');

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'));
      if (!adminUser || adminUser.email !== 'Admin.solacestay@gmail.com') {
        navigate('/admin-login');
        return;
      }

      // Check if staff data exists in localStorage
      const savedStaffData = localStorage.getItem('staffData');
      if (savedStaffData) {
        setStaffData(JSON.parse(savedStaffData));
      } else {
        // If no saved staff data, initialize it
        try {
          setLoading(true);
          await initializeStaffData();
          await fetchStaffData();
        } catch (error) {
          console.error('Error initializing staff data:', error);
        } finally {
          setLoading(false);
        }
      }

      fetchData(); // Fetch other dashboard data
    };

    checkAdminAndLoadData();
  }, [navigate]);

  const fetchData = async () => {
    try {
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

  const fetchStaffData = async () => {
    try {
      console.log('Fetching staff data...');
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      console.log('Staff snapshot:', staffSnapshot.docs.length, 'documents found');
      const staff = staffSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          salary: parseInt(data.salary) || 0
        };
      });
      console.log('Processed staff data:', staff);
      setStaffData(staff);
      // Save staff data to localStorage
      localStorage.setItem('staffData', JSON.stringify(staff));
    } catch (error) {
      console.error('Error fetching staff data:', error);
      alert('Error loading staff data. Please try again.');
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

    // Staff Section
    doc.addPage();
    doc.text('Staff Information', 14, 15);
    const staffTableData = staffData.map(staff => [
      staff.name,
      staff.designation,
      staff.branch
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Name', 'Designation', 'Branch']],
      body: staffTableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [128, 0, 32] },
      columnStyles: {
        0: { cellWidth: 40 }, // Name column width
        1: { cellWidth: 40 }, // Designation column width
        2: { cellWidth: 30 }  // Branch column width
      }
    });

    // Add staff photos in a grid layout
    let currentY = doc.lastAutoTable.finalY + 20;
    const photosPerRow = 3;
    const photoWidth = 60;
    const photoHeight = 60;
    const spacing = 10;

    staffData.forEach((staff, index) => {
      const row = Math.floor(index / photosPerRow);
      const col = index % photosPerRow;
      const x = 14 + (col * (photoWidth + spacing));
      const y = currentY + (row * (photoHeight + spacing));

      // Add photo
      doc.addImage(
        staff.photo,
        'JPEG',
        x,
        y,
        photoWidth,
        photoHeight
      );

      // Add name below photo
      doc.setFontSize(8);
      doc.text(
        staff.name,
        x + photoWidth/2,
        y + photoHeight + 5,
        { align: 'center' }
      );

      // Add designation below name
      doc.setFontSize(7);
      doc.text(
        staff.designation,
        x + photoWidth/2,
        y + photoHeight + 12,
        { align: 'center' }
      );

      // Add branch below designation
      doc.text(
        staff.branch,
        x + photoWidth/2,
        y + photoHeight + 19,
        { align: 'center' }
      );

      // Update currentY if we need a new page
      if (y + photoHeight + 30 > 280) {
        doc.addPage();
        currentY = 20;
      }
    });

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
    // Clear all session data
    localStorage.removeItem('adminUser');
    localStorage.removeItem('staffData');
    // Navigate to home page
    navigate('/');
  };

  const handleInitializeStaffData = async () => {
    try {
      setLoading(true);
      await initializeStaffData();
      await fetchStaffData();
      alert('Staff data initialized successfully!');
    } catch (error) {
      console.error('Error initializing staff data:', error);
      alert('Error initializing staff data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle staff profile click
  const handleStaffClick = async (staff) => {
    try {
      const staffDoc = await getDoc(doc(db, 'staff', staff.id));
      if (staffDoc.exists()) {
        const data = staffDoc.data();
        setSelectedStaff({ 
          ...staff, 
          ...data,
          salary: parseInt(data.salary) || 0 // Ensure salary is a number
        });
      } else {
        setSelectedStaff({
          ...staff,
          salary: parseInt(staff.salary) || 0 // Ensure salary is a number
        });
      }
      setShowProfile(true);
    } catch (error) {
      console.error('Error fetching staff details:', error);
      alert('Error loading staff details. Please try again.');
    }
  };

  // Function to close profile
  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedStaff(null);
  };

  // Add function to handle salary update
  const handleSalaryUpdate = async (staffId) => {
    try {
      const newSalary = parseInt(editedSalary);
      if (isNaN(newSalary) || newSalary < 0) {
        alert('Please enter a valid salary amount');
        return;
      }

      const staffRef = doc(db, 'staff', staffId);
      await updateDoc(staffRef, {
        salary: newSalary
      });

      // Update local state
      setStaffData(prevStaff => 
        prevStaff.map(staff => 
          staff.id === staffId 
            ? { ...staff, salary: newSalary }
            : staff
        )
      );
      setSelectedStaff(prev => ({ ...prev, salary: newSalary }));
      setIsEditing(false);
      alert('Salary updated successfully!');
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Error updating salary. Please try again.');
    }
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
        <div className={styles.headerButtons}>
          {staffData.length === 0 && (
            <button onClick={handleInitializeStaffData} className={styles.initializeButton}>
              Initialize Staff Data
            </button>
          )}
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
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
                <div 
                  key={staff.id} 
                  className={styles.staffCard}
                  onClick={() => handleStaffClick(staff)}
                >
                  <img 
                    src={staff.photo} 
                    alt={staff.name} 
                    className={styles.staffPhoto}
                  />
                  <div className={styles.staffHeader}>
                    <h3>{staff.name}</h3>
                    <span className={styles.staffRole}>{staff.designation}</span>
                  </div>
                  <div className={styles.staffInfo}>
                    <p><strong>Branch:</strong> {staff.branch}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Staff Profile Modal */}
            {showProfile && selectedStaff && (
              <div className={styles.profileModal}>
                <div className={styles.profileContent}>
                  <button className={styles.closeButton} onClick={handleCloseProfile}>
                    ×
                  </button>
                  <div className={styles.profileHeader}>
                    <img 
                      src={selectedStaff.photo} 
                      alt={selectedStaff.name} 
                      className={styles.profilePhoto}
                    />
                    <div className={styles.profileTitle}>
                      <h2>{selectedStaff.name}</h2>
                      <p className={styles.profileDesignation}>{selectedStaff.designation}</p>
                    </div>
                  </div>
                  <div className={styles.profileDetails}>
                    <div className={styles.detailSection}>
                      <h3>Personal Information</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <label>Age</label>
                          <span>{selectedStaff.age} years</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Gender</label>
                          <span>{selectedStaff.gender}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Blood Group</label>
                          <span>{selectedStaff.bloodGroup}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailSection}>
                      <h3>Contact Information</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <label>Email</label>
                          <span>{selectedStaff.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Phone</label>
                          <span>{selectedStaff.phone}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Emergency Contact</label>
                          <span>{selectedStaff.emergencyContact}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailSection}>
                      <h3>Address</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <label>Address</label>
                          <span>{selectedStaff.address}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>City</label>
                          <span>{selectedStaff.city}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>State</label>
                          <span>{selectedStaff.state}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailSection}>
                      <h3>Professional Details</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <label>Department</label>
                          <span>{selectedStaff.department}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Branch</label>
                          <span>{selectedStaff.branch}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Shift</label>
                          <span>{selectedStaff.shift}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Joining Date</label>
                          <span>{selectedStaff.joiningDate}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Education</label>
                          <span>{selectedStaff.education}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <label>Experience</label>
                          <span>{selectedStaff.experience}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.detailSection}>
                      <h3>Salary Information</h3>
                      <div className={styles.salaryContainer}>
                        {isEditing ? (
                          <div className={styles.salaryEdit}>
                            <input
                              type="number"
                              value={editedSalary}
                              onChange={(e) => setEditedSalary(e.target.value)}
                              className={styles.salaryInput}
                              placeholder="Enter new salary"
                            />
                            <div className={styles.salaryButtons}>
                              <button
                                onClick={() => handleSalaryUpdate(selectedStaff.id)}
                                className={styles.saveButton}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditedSalary('');
                                }}
                                className={styles.cancelButton}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.salaryDisplay}>
                            <div className={styles.detailItem}>
                              <label>Current Salary</label>
                              <span>₹{(selectedStaff.salary || 0).toLocaleString('en-IN')}/month</span>
                            </div>
                            <button
                              onClick={() => {
                                setEditedSalary(selectedStaff.salary ? selectedStaff.salary.toString() : '0');
                                setIsEditing(true);
                              }}
                              className={styles.editButton}
                            >
                              Edit Salary
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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