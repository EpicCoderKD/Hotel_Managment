import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { initializeStaffData } from '../utils/initializeStaffData';
import { initializeRoomData } from '../utils/roomManagement';
import styles from './AdminDashboard.module.css';
import { useTheme } from '../context/ThemeContext';
import AdminReports from '../components/AdminReports';
import { initializeRoomConfigurations } from '../utils/initializeData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [initializingStaff, setInitializingStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roomData, setRoomData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [error, setError] = useState('');

  const branches = ['Mumbai', 'Coorg', 'Ahmedabad'];

  useEffect(() => {
    const checkAdmin = async () => {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'));
      if (!adminUser || adminUser.email !== 'Admin.solacestay@gmail.com') {
        navigate('/admin-login');
      }
    };

    checkAdmin();
    fetchBookings();
    fetchStaffData();
    fetchRoomData();
  }, [navigate]);

  const fetchStaffData = async () => {
    try {
      const staffCollection = collection(db, 'staff');
      const staffSnapshot = await getDocs(staffCollection);
      const staff = staffSnapshot.docs.map(doc => ({
          id: doc.id,
        ...doc.data()
      }));
      setStaffData(staff);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const bookingsCollection = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsCollection);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const roomsRef = collection(db, 'rooms');
      const snapshot = await getDocs(roomsRef);
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoomData(rooms);
      setError('');
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Error fetching room data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeStaffData = async () => {
    try {
      setInitializingStaff(true);
      await initializeStaffData();
      await fetchStaffData(); // Fetch updated staff data
      alert('Staff data initialized successfully!');
    } catch (error) {
      console.error('Error initializing staff data:', error);
      alert('Error initializing staff data. Please try again.');
    } finally {
      setInitializingStaff(false);
    }
  };

  const handleInitializeRoomData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if rooms already exist
      const roomsRef = collection(db, 'rooms');
      const existingRooms = await getDocs(roomsRef);
      
      if (!existingRooms.empty) {
        console.log('Rooms already exist');
        await fetchRoomData();
        return;
      }

      // Initialize default room configurations
      const defaultRooms = [
        // Mumbai Branch
        {
          branchName: 'Mumbai',
          roomType: 'Standard',
          totalRooms: 10,
          pricePerNight: 3000
        },
        {
          branchName: 'Mumbai',
          roomType: 'Deluxe',
          totalRooms: 8,
          pricePerNight: 5000
        },
        {
          branchName: 'Mumbai',
          roomType: 'Master',
          totalRooms: 5,
          pricePerNight: 8000
        },
        {
          branchName: 'Mumbai',
          roomType: 'Honeymoon',
          totalRooms: 3,
          pricePerNight: 10000
        },
        // Coorg Branch
        {
          branchName: 'Coorg',
          roomType: 'Standard',
          totalRooms: 12,
          pricePerNight: 2500
        },
        {
          branchName: 'Coorg',
          roomType: 'Deluxe',
          totalRooms: 6,
          pricePerNight: 4500
        },
        {
          branchName: 'Coorg',
          roomType: 'Master',
          totalRooms: 4,
          pricePerNight: 7000
        },
        {
          branchName: 'Coorg',
          roomType: 'Honeymoon',
          totalRooms: 2,
          pricePerNight: 9000
        },
        // Ahmedabad Branch
        {
          branchName: 'Ahmedabad',
          roomType: 'Standard',
          totalRooms: 15,
          pricePerNight: 2000
        },
        {
          branchName: 'Ahmedabad',
          roomType: 'Deluxe',
          totalRooms: 10,
          pricePerNight: 3500
        },
        {
          branchName: 'Ahmedabad',
          roomType: 'Master',
          totalRooms: 6,
          pricePerNight: 6000
        },
        {
          branchName: 'Ahmedabad',
          roomType: 'Honeymoon',
          totalRooms: 4,
          pricePerNight: 8000
        }
      ];

      // Add each room configuration
      const promises = defaultRooms.map(async (room) => {
        try {
          await addDoc(roomsRef, {
            ...room,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error adding room for ${room.branchName} - ${room.roomType}:`, error);
        }
      });

      await Promise.all(promises);
      await fetchRoomData();
      alert('Room configurations initialized successfully!');
    } catch (err) {
      console.error('Error initializing room data:', err);
      setError('Error initializing room data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  const getBranchRooms = () => {
    if (selectedBranch === 'all') {
      return roomData;
    }
    return roomData.filter(room => room.branchName === selectedBranch);
  };

  const calculateTotalRooms = (branch = 'all') => {
    const rooms = branch === 'all' ? roomData : roomData.filter(room => room.branchName === branch);
    return rooms.reduce((total, room) => total + room.totalRooms, 0);
  };

  return (
    <div className={`${styles.dashboard} ${isDarkMode ? styles.darkMode : ''}`}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.headerButtons}>
          <button
            className={styles.initializeButton}
            onClick={handleInitializeStaffData}
            disabled={initializingStaff}
          >
            {initializingStaff ? 'Initializing Staff...' : 'Initialize Staff Data'}
          </button>
          <button
            className={styles.initializeButton}
            onClick={handleInitializeRoomData}
            disabled={loading}
          >
            {loading ? 'Initializing...' : 'Initialize Room Data'}
            </button>
          <button className={styles.themeButton} onClick={toggleTheme}>
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.tabs}>
        <button
            className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
        >
            Dashboard
        </button>
        <button
            className={`${styles.tabButton} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
                  </button>
                              <button
            className={`${styles.tabButton} ${activeTab === 'rooms' ? styles.active : ''}`}
            onClick={() => setActiveTab('rooms')}
                              >
            Rooms
                              </button>
                              <button
            className={`${styles.tabButton} ${activeTab === 'reports' ? styles.active : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
                              </button>
                            <button
            className={`${styles.tabButton} ${activeTab === 'staff' ? styles.active : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff
                            </button>
                          </div>

        <div className={styles.tabContent}>
          {activeTab === 'dashboard' && (
            <div className={styles.dashboardStats}>
              <div className={styles.statCard}>
                <h3>Total Bookings</h3>
                <p>{bookings.length}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Active Bookings</h3>
                <p>{bookings.filter(b => b.status === 'confirmed').length}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Total Staff</h3>
                <p>{staffData.length}</p>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className={styles.bookingsList}>
              <h2>Recent Bookings</h2>
              <div className={styles.bookingsTable}>
                <div className={styles.bookingHeader}>
                  <span>Booking ID</span>
                  <span>Guest Name</span>
                  <span>Room Type</span>
                  <span>Branch</span>
                  <span>Status</span>
                </div>
                {bookings.map(booking => (
                  <div key={booking.id} className={styles.bookingRow}>
                    <span className={styles.bookingCell} data-label="Booking ID">
                      {booking.id}
                    </span>
                    <span className={styles.bookingCell} data-label="Guest Name">
                      {booking.firstName && booking.lastName 
                        ? `${booking.firstName} ${booking.lastName}`
                        : booking.username || 'N/A'}
                    </span>
                    <span className={styles.bookingCell} data-label="Room Type">
                      {booking.roomType || 'N/A'}
                    </span>
                    <span className={styles.bookingCell} data-label="Branch">
                      {booking.branch || booking.branchName || 'N/A'}
                    </span>
                    <span 
                      className={`${styles.bookingCell} ${styles.status} ${styles[booking.status || 'pending']}`}
                      data-label="Status"
                    >
                      {booking.status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
                </div>
          )}

          {activeTab === 'rooms' && (
            <div className={styles.roomsManagement}>
              <h2>Room Management</h2>
              <div className={styles.branchSelector}>
                <button 
                  className={`${styles.branchButton} ${selectedBranch === 'all' ? styles.active : ''}`}
                  onClick={() => setSelectedBranch('all')}
                >
                  All Branches
                </button>
                {branches.map(branch => (
                  <button
                    key={branch}
                    className={`${styles.branchButton} ${selectedBranch === branch ? styles.active : ''}`}
                    onClick={() => setSelectedBranch(branch)}
                  >
                    {branch}
                  </button>
                ))}
              </div>

              <div className={styles.roomsGrid}>
                {getBranchRooms().map(room => (
                  <div key={room.id} className={styles.roomCard}>
                    <div className={styles.roomHeader}>
                      <h3>{room.roomType}</h3>
                      <span className={styles.branchTag}>{room.branchName}</span>
                    </div>
                    <div className={styles.roomInfo}>
                      <div className={styles.roomStat}>
                        <span>Total Rooms</span>
                        <strong>{room.totalRooms}</strong>
                      </div>
                      <div className={styles.roomStat}>
                        <span>Price per Night</span>
                        <strong>₹{room.pricePerNight.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.roomsSummary}>
                <div className={styles.summaryCard}>
                  <h4>Total Rooms ({selectedBranch === 'all' ? 'All Branches' : selectedBranch})</h4>
                  <p>{calculateTotalRooms(selectedBranch)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && <AdminReports />}

          {activeTab === 'staff' && (
            <div className={styles.staffList}>
              <h2>Staff Members</h2>
              <div className={styles.staffGrid}>
                {staffData.map(staff => (
                  <div key={staff.id} className={styles.staffCard}>
                    <div className={styles.staffHeader}>
                      <h3>{staff.name}</h3>
                      <span className={styles.designation}>{staff.designation}</span>
                    </div>
                    <div className={styles.staffInfo}>
                      <p><strong>Branch:</strong> {staff.branch}</p>
                      <p><strong>Email:</strong> {staff.email}</p>
                      <p><strong>Phone:</strong> {staff.phone}</p>
                      <p><strong>Department:</strong> {staff.department}</p>
                      <p><strong>Joining Date:</strong> {staff.joiningDate}</p>
                      <p><strong>Salary:</strong> ₹{staff.salary.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 