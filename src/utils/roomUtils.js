import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const getRoomPrice = async (branchName, roomType) => {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Room configuration not found');
    }

    const roomConfig = querySnapshot.docs[0].data();
    return roomConfig.pricePerNight || 0;
  } catch (error) {
    console.error('Error fetching room price:', error);
    throw error;
  }
};

export const checkRoomAvailability = async (branchName, roomType, checkInDate, checkOutDate) => {
  try {
    // First check if room exists
    const roomsRef = collection(db, 'rooms');
    const roomQuery = query(
      roomsRef,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType)
    );

    const roomSnapshot = await getDocs(roomQuery);
    if (roomSnapshot.empty) {
      throw new Error('Room configuration not found');
    }

    const roomData = roomSnapshot.docs[0].data();
    const totalRooms = roomData.totalRooms || 0;

    // Then check existing bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType),
      where('status', '==', 'confirmed')
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const overlappingBookings = bookingsSnapshot.docs.filter(doc => {
      const booking = doc.data();
      const newCheckIn = new Date(checkInDate);
      const newCheckOut = new Date(checkOutDate);
      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = new Date(booking.checkOutDate);

      return (
        (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
        (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
        (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
      );
    });

    const isAvailable = overlappingBookings.length < totalRooms;
    return {
      isAvailable,
      totalRooms,
      availableRooms: totalRooms - overlappingBookings.length
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
}; 