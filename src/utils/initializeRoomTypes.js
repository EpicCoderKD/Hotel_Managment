import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const roomTypesData = [
  {
    name: 'Standard Room',
    prefix: 'S',
    totalRooms: 30,
    pricePerNight: 3999,
    description: 'Comfortable and well-designed, our Standard Rooms provide excellent value. Featuring all essential amenities, these rooms are perfect for practical travelers who appreciate quality and comfort at a great price.',
    amenities: [
      'Double Bed',
      'En-suite Bathroom',
      '32" TV',
      'Work Space',
      'Air Conditioning',
      'Daily Housekeeping'
    ]
  },
  {
    name: 'Deluxe Room',
    prefix: 'D',
    totalRooms: 25,
    pricePerNight: 5999,
    description: 'Our Deluxe Rooms offer the perfect blend of comfort and style. Each room features a queen-size bed, modern furnishings, and a well-appointed bathroom. Ideal for business travelers or couples seeking quality accommodation.',
    amenities: [
      'Queen Size Bed',
      'City View',
      'Modern Bathroom',
      '43" Smart TV',
      'Work Desk',
      'Tea/Coffee Maker'
    ]
  },
  {
    name: 'Master Suite',
    prefix: 'M',
    totalRooms: 25,
    pricePerNight: 9999,
    description: 'Experience ultimate luxury in our Master Suite. This suite offers a spacious king-size bed, an elegant living area, and a deluxe bathroom with a jacuzzi. Enjoy breathtaking city views from your private balcony, making your stay truly unforgettable.',
    amenities: [
      'King-Size Bed',
      'Private Balcony',
      'Luxury Bathroom with Jacuzzi',
      '55" Smart TV',
      'Spacious Living Area',
      'Complimentary Breakfast'
    ]
  },
  {
    name: 'Honeymoon Suite',
    prefix: 'H',
    totalRooms: 20,
    pricePerNight: 12999,
    description: 'Indulge in romance and luxury in our exclusive Honeymoon Suite. Featuring a stunning king-size canopy bed, private balcony, and an elegant marble bathroom. The suite offers breathtaking panoramic views, creating the perfect ambiance for an unforgettable getaway.',
    amenities: [
      'King-Size Canopy Bed',
      'Private Balcony with Panoramic Views',
      'Elegant Marble Bathroom with Spa Tub',
      'Mood Lighting',
      'Premium Champagne Service',
      'Intimate Dining Space'
    ]
  }
];

const branches = ['coorg', 'mumbai', 'ahmedabad'];

export const initializeRoomTypes = async () => {
  try {
    const roomTypesRef = collection(db, 'roomTypes');
    
    // Initialize room types
    for (const roomType of roomTypesData) {
      await setDoc(doc(roomTypesRef, roomType.name), roomType);
    }
    
    // Initialize individual rooms for each branch
    for (const branch of branches) {
      for (const roomType of roomTypesData) {
        // Generate the specified number of rooms for each room type
        for (let i = 1; i <= roomType.totalRooms; i++) {
          const roomNumber = `${roomType.prefix}${i.toString().padStart(3, '0')}`;
          const roomId = `${branch}-${roomNumber}`;
          
          await setDoc(doc(db, 'rooms', roomId), {
            roomId,
            roomNumber,
            roomType: roomType.name,
            branch,
            pricePerNight: roomType.pricePerNight,
            isAvailable: true,
            isBooked: false,
            currentBookingId: null,
            lastBookingDate: null,
            description: roomType.description,
            amenities: roomType.amenities,
            maintenanceStatus: 'operational',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    console.log('Room types and individual rooms initialized successfully');
  } catch (error) {
    console.error('Error initializing room types and rooms:', error);
  }
};