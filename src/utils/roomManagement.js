import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, and } from 'firebase/firestore';

// Static room data structure
const staticRoomData = [
  // Coorg Branch
  {
    branchName: 'Coorg',
    roomType: 'Master Suite',
    totalRooms: 5,
    pricePerNight: 15000
  },
  {
    branchName: 'Coorg',
    roomType: 'Deluxe',
    totalRooms: 10,
    pricePerNight: 10000
  },
  {
    branchName: 'Coorg',
    roomType: 'Standard',
    totalRooms: 15,
    pricePerNight: 5000
  },
  // Mumbai Branch
  {
    branchName: 'Mumbai',
    roomType: 'Master Suite',
    totalRooms: 8,
    pricePerNight: 18000
  },
  {
    branchName: 'Mumbai',
    roomType: 'Deluxe',
    totalRooms: 12,
    pricePerNight: 12000
  },
  {
    branchName: 'Mumbai',
    roomType: 'Standard',
    totalRooms: 20,
    pricePerNight: 6000
  },
  // Ahmedabad Branch
  {
    branchName: 'Ahmedabad',
    roomType: 'Master Suite',
    totalRooms: 6,
    pricePerNight: 14000
  },
  {
    branchName: 'Ahmedabad',
    roomType: 'Deluxe',
    totalRooms: 10,
    pricePerNight: 9000
  },
  {
    branchName: 'Ahmedabad',
    roomType: 'Standard',
    totalRooms: 15,
    pricePerNight: 4500
  }
];

// Initialize static room data in Firebase
export const initializeRoomData = async () => {
  const roomsData = [
    // Coorg Branch (100 rooms)
    {
      branchName: 'Coorg',
      roomType: 'Standard',
      totalRooms: 35,
      pricePerNight: 2500
    },
    {
      branchName: 'Coorg',
      roomType: 'Deluxe',
      totalRooms: 25,
      pricePerNight: 3500
    },
    {
      branchName: 'Coorg',
      roomType: 'Master',
      totalRooms: 25,
      pricePerNight: 4500
    },
    {
      branchName: 'Coorg',
      roomType: 'Honeymoon',
      totalRooms: 15,
      pricePerNight: 5500
    },

    // Mumbai Branch (80 rooms)
    {
      branchName: 'Mumbai',
      roomType: 'Standard',
      totalRooms: 30,
      pricePerNight: 3000
    },
    {
      branchName: 'Mumbai',
      roomType: 'Deluxe',
      totalRooms: 20,
      pricePerNight: 4000
    },
    {
      branchName: 'Mumbai',
      roomType: 'Master',
      totalRooms: 20,
      pricePerNight: 5000
    },
    {
      branchName: 'Mumbai',
      roomType: 'Honeymoon',
      totalRooms: 10,
      pricePerNight: 6000
    },

    // Ahmedabad Branch (60 rooms)
    {
      branchName: 'Ahmedabad',
      roomType: 'Standard',
      totalRooms: 25,
      pricePerNight: 2000
    },
    {
      branchName: 'Ahmedabad',
      roomType: 'Deluxe',
      totalRooms: 15,
      pricePerNight: 3000
    },
    {
      branchName: 'Ahmedabad',
      roomType: 'Master',
      totalRooms: 12,
      pricePerNight: 4000
    },
    {
      branchName: 'Ahmedabad',
      roomType: 'Honeymoon',
      totalRooms: 8,
      pricePerNight: 5000
    }
  ];

  try {
    const roomsCollection = collection(db, 'rooms');
    
    // Add each room configuration to Firestore
    for (const room of roomsData) {
      await addDoc(roomsCollection, room);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing room data:', error);
    throw error;
  }
};

// Check room availability
export const checkRoomAvailability = async (branchName, roomType, checkInDate, checkOutDate) => {
  try {
    // Convert dates to timestamps for comparison
    const checkIn = new Date(checkInDate).getTime();
    const checkOut = new Date(checkOutDate).getTime();

    // Get total rooms of requested type at the branch
    const roomsCollection = collection(db, 'rooms');
    const roomQuery = query(
      roomsCollection,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType)
    );
    const roomSnapshot = await getDocs(roomQuery);
    const roomData = roomSnapshot.docs[0]?.data();
    
    if (!roomData) {
      throw new Error('Room configuration not found');
    }

    const totalRooms = roomData.totalRooms;

    // Get existing bookings for the same period
    const bookingsCollection = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsCollection,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType),
      where('status', '==', 'confirmed')
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const overlappingBookings = bookingsSnapshot.docs.filter(doc => {
      const booking = doc.data();
      const bookingCheckIn = new Date(booking.checkInDate).getTime();
      const bookingCheckOut = new Date(booking.checkOutDate).getTime();
      
      // Check if dates overlap
      return (
        (checkIn >= bookingCheckIn && checkIn < bookingCheckOut) ||
        (checkOut > bookingCheckIn && checkOut <= bookingCheckOut) ||
        (checkIn <= bookingCheckIn && checkOut >= bookingCheckOut)
      );
    });

    const bookedRooms = overlappingBookings.length;
    const availableRooms = totalRooms - bookedRooms;

    return {
      available: availableRooms > 0,
      availableRooms,
      totalRooms,
      pricePerNight: roomData.pricePerNight
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
};

// Store booking in database
export const storeBooking = async (bookingData) => {
  try {
    // Check availability first
    const availability = await checkRoomAvailability(
      bookingData.branchName,
      bookingData.roomType,
      bookingData.checkInDate,
      bookingData.checkOutDate
    );

    if (!availability.available) {
      throw new Error('No rooms available for the selected dates');
    }

    // Add booking to database
    const bookingsCollection = collection(db, 'bookings');
    const newBooking = {
      ...bookingData,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(bookingsCollection, newBooking);
    return {
      success: true,
      bookingId: docRef.id,
      ...newBooking
    };
  } catch (error) {
    console.error('Error storing booking:', error);
    throw error;
  }
}; 