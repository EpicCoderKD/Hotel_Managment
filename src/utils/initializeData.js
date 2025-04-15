import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const defaultRoomConfigurations = [
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

export const initializeRoomConfigurations = async () => {
  try {
    const roomConfigRef = collection(db, 'roomConfigurations');
    
    // Check if configurations already exist
    const existingConfigs = await getDocs(roomConfigRef);
    if (!existingConfigs.empty) {
      console.log('Room configurations already exist');
      return;
    }

    // Initialize room configurations
    const promises = defaultRoomConfigurations.map(async (config) => {
      try {
        await addDoc(roomConfigRef, {
          ...config,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error adding configuration for ${config.branchName} - ${config.roomType}:`, error);
      }
    });

    await Promise.all(promises);
    console.log('Room configurations initialized successfully');
  } catch (error) {
    console.error('Error initializing room configurations:', error);
    throw error;
  }
};

export const checkRoomConfigurationExists = async (branchName, roomType) => {
  try {
    const roomConfigRef = collection(db, 'roomConfigurations');
    const q = query(
      roomConfigRef,
      where('branchName', '==', branchName),
      where('roomType', '==', roomType)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking room configuration:', error);
    return false;
  }
}; 