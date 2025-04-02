import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './AdminDashboard.module.css';
import { initializeStaffData } from '../utils/initializeStaffData';
import { initializeBranches } from '../utils/initializeBranches';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [staffData, setStaffData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSalary, setEditedSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomStats, setRoomStats] = useState({});
  const [branchFilter, setBranchFilter] = useState('all');

  // Fetch staff data
  useEffect(() => {
    fetchStaffData();
  }, []);
  
  // Fetch branch data
  useEffect(() => {
    fetchBranchData();
  }, []);
  
  // Fetch room data based on branch filter
  useEffect(() => {
    fetchRoomData(branchFilter);
  }, [branchFilter]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const staffRef = collection(db, 'staff');
      const staffSnapshot = await getDocs(staffRef);
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaffData(staffData);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchData = async () => {
    try {
      setLoading(true);
      const branchesRef = collection(db, 'branches');
      const branchesSnapshot = await getDocs(branchesRef);
      const branchesData = branchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branch data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRoomData = async (branchFilter) => {
    try {
      setLoading(true);
      const roomsRef = collection(db, 'rooms');
      let roomsQuery;
      
      if (branchFilter && branchFilter !== 'all') {
        roomsQuery = query(roomsRef, where('branch', '==', branchFilter));
      } else {
        roomsQuery = roomsRef;
      }
      
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRooms(roomsData);
      
      // Calculate room statistics
      const stats = {};
      roomsData.forEach(room => {
        if (!stats[room.branch]) {
          stats[room.branch] = {
            total: 0,
            available: 0,
            booked: 0,
            roomTypes: {}
          };
        }
        
        stats[room.branch].total++;
        
        if (room.isAvailable && !room.isBooked) {
          stats[room.branch].available++;
        }
        
        if (room.isBooked) {
          stats[room.branch].booked++;
        }
        
        // Count by room type
        if (!stats[room.branch].roomTypes[room.roomType]) {
          stats[room.branch].roomTypes[room.roomType] = {
            total: 0,
            available: 0,
            booked: 0
          };
        }
        
        stats[room.branch].roomTypes[room.roomType].total++;
        
        if (room.isAvailable && !room.isBooked) {
          stats[room.branch].roomTypes[room.roomType].available++;
        }
        
        if (room.isBooked) {
          stats[room.branch].roomTypes[room.roomType].booked++;
        }
      });
      
      setRoomStats(stats);
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedStaff(null);
    setIsEditing(false);
    setEditedSalary('');
  };

  const handleSalaryUpdate = async (staffId) => {
    if (!editedSalary) return;

    try {
      setLoading(true);
      const salary = parseInt(editedSalary);
      
      if (isNaN(salary) || salary < 0) {
        alert('Please enter a valid salary amount');
        return;
      }

      const staffRef = doc(db, 'staff', staffId);
      await updateDoc(staffRef, {
        salary: salary
      });

      // Update local state
      setStaffData(prevState => 
        prevState.map(staff => 
          staff.id === staffId ? { ...staff, salary } : staff
        )
      );

      if (selectedStaff) {
        setSelectedStaff({
          ...selectedStaff,
          salary
        });
      }

      setIsEditing(false);
      setEditedSalary('');
      alert('Salary updated successfully!');
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Error updating salary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeData = async (type) => {
    try {
      setLoading(true);
      if (type === 'staff') {
        await initializeStaffData();
        await fetchStaffData();
      } else if (type === 'branches') {
        await initializeBranches();
        await fetchBranchData();
        await fetchRoomData(branchFilter);
      }
      alert(`${type === 'staff' ? 'Staff' : 'Branch and room'} data initialized successfully!`);
    } catch (error) {
      console.error(`Error initializing ${type} data:`, error);
      alert(`Error initializing ${type} data. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'staff' ? styles.active : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff Management
          </button>
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'rooms' ? styles.active : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Room Management
          </button>
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'branches' ? styles.active : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            Branch Management
          </button>
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button 
            className={`${styles.sidebarButton} ${activeTab === 'reports' ? styles.active : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        <div className={styles.mainContent}>
          {activeTab === 'staff' && (
            <div>
              <h2>Staff Management</h2>
              <button 
                className={styles.initializeButton}
                onClick={() => handleInitializeData('staff')}
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Initialize Staff Data'}
              </button>
              
              <div className={styles.staffGrid}>
                {staffData.map(staff => (
                  <div 
                    key={staff.id} 
                    className={styles.staffCard}
                    onClick={() => handleStaffClick(staff)}
                  >
                    <div className={styles.staffHeader}>
                      <h3>{staff.name}</h3>
                      <span className={styles.staffRole}>{staff.designation}</span>
                    </div>
                    <div className={styles.staffInfo}>
                      <p><strong>Branch:</strong> {staff.branch}</p>
                      <p><strong>Email:</strong> {staff.email}</p>
                      <p><strong>Phone:</strong> {staff.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div>
              <h2>Branch Management</h2>
              <button 
                className={styles.initializeButton}
                onClick={() => handleInitializeData('branches')}
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Initialize Branch & Room Data'}
              </button>
              
              <div className={styles.branchesGrid}>
                {branches.map(branch => (
                  <div key={branch.id} className={styles.branchCard}>
                    <div className={styles.branchHeader}>
                      <h3>{branch.name}</h3>
                      <span className={styles.branchRating}>{branch.rating} ★</span>
                    </div>
                    <div className={styles.branchInfo}>
                      <p><strong>Total Rooms:</strong> {branch.totalRooms}</p>
                      <p><strong>Location:</strong> {branch.location.city}, {branch.location.state}</p>
                      <p><strong>Contact:</strong> {branch.contactInfo.phone}</p>
                    </div>
                    <div className={styles.branchRoomTypes}>
                      <h4>Room Types:</h4>
                      <ul>
                        {Object.entries(branch.roomTypes).map(([name, data]) => (
                          <li key={name}>
                            {name} ({data.totalRooms}) - ₹{data.pricePerNight}/night
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div>
              <h2>Room Management</h2>
              
              <div className={styles.roomFilterControls}>
                <div className={styles.filterGroup}>
                  <label>Filter by Branch:</label>
                  <select 
                    value={branchFilter} 
                    onChange={(e) => setBranchFilter(e.target.value)}
                    disabled={loading}
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.roomStatsCards}>
                {Object.entries(roomStats).map(([branchId, stats]) => {
                  const branchName = branches.find(b => b.id === branchId)?.name || branchId;
                  
                  return (
                    <div key={branchId} className={styles.roomStatCard}>
                      <h3>{branchName}</h3>
                      <div className={styles.statNumbers}>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>{stats.total}</span>
                          <span className={styles.statLabel}>Total Rooms</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>{stats.available}</span>
                          <span className={styles.statLabel}>Available</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>{stats.booked}</span>
                          <span className={styles.statLabel}>Booked</span>
                        </div>
                      </div>
                      
                      <div className={styles.roomTypeStats}>
                        <h4>By Room Type:</h4>
                        <div className={styles.roomTypeTable}>
                          <table>
                            <thead>
                              <tr>
                                <th>Room Type</th>
                                <th>Total</th>
                                <th>Available</th>
                                <th>Booked</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stats.roomTypes).map(([roomType, typeStats]) => (
                                <tr key={roomType}>
                                  <td>{roomType}</td>
                                  <td>{typeStats.total}</td>
                                  <td>{typeStats.available}</td>
                                  <td>{typeStats.booked}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className={styles.roomsTable}>
                <h3>All Rooms</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Room Number</th>
                      <th>Branch</th>
                      <th>Room Type</th>
                      <th>Price/Night</th>
                      <th>Status</th>
                      <th>Max Guests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.id} className={room.isBooked ? styles.bookedRoom : ''}>
                        <td>{room.roomNumber}</td>
                        <td>{room.branchName}</td>
                        <td>{room.roomType}</td>
                        <td>₹{room.pricePerNight}</td>
                        <td>
                          {room.isBooked 
                            ? <span className={styles.bookedStatus}>Booked</span> 
                            : <span className={styles.availableStatus}>Available</span>}
                        </td>
                        <td>{room.maxGuests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2>Bookings</h2>
              <p>Booking management functionality coming soon.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2>Reports</h2>
              <p>Reporting functionality coming soon.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;