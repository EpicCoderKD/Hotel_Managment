import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

// Branch data with room types
const branchesData = [
  {
    id: 'coorg',
    name: 'Coorg',
    location: {
      address: '123 Hill Road, Madikeri',
      city: 'Coorg',
      state: 'Karnataka',
      zipCode: '571201',
      country: 'India',
      coordinates: {
        latitude: 12.4244,
        longitude: 75.7382
      }
    },
    contactInfo: {
      phone: '+91 98765 43210',
      email: 'coorg@solacestay.com',
      websiteUrl: 'https://solacestay.com/coorg'
    },
    amenities: [
      'Swimming Pool',
      'Spa & Wellness Center',
      'Restaurant',
      'Free WiFi',
      'Room Service',
      'Parking',
      'Business Center',
      'Fitness Center'
    ],
    images: [],
    rating: 4.8,
    totalRooms: 100,
    roomTypes: {
      'Standard Room': {
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
        ],
        maxGuests: 3,
        bedType: 'Double Bed',
        roomSize: '25 sq m'
      },
      'Deluxe Room': {
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
        ],
        maxGuests: 3,
        bedType: 'Queen Size Bed',
        roomSize: '30 sq m'
      },
      'Master Suite': {
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
        ],
        maxGuests: 4,
        bedType: 'King Size Bed',
        roomSize: '45 sq m'
      },
      'Honeymoon Suite': {
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
        ],
        maxGuests: 2,
        bedType: 'King Size Canopy Bed',
        roomSize: '50 sq m'
      }
    }
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    location: {
      address: '456 Marine Drive, Nariman Point',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400021',
      country: 'India',
      coordinates: {
        latitude: 18.9442,
        longitude: 72.8234
      }
    },
    contactInfo: {
      phone: '+91 98765 43211',
      email: 'mumbai@solacestay.com',
      websiteUrl: 'https://solacestay.com/mumbai'
    },
    amenities: [
      'Rooftop Pool',
      'Luxury Spa',
      'Fine Dining Restaurant',
      'High-Speed WiFi',
      'Premium Room Service',
      'Valet Parking',
      'Conference Rooms',
      'Fitness Studio with Sea View'
    ],
    images: [],
    rating: 4.7,
    totalRooms: 80,
    roomTypes: {
      'Standard Room': {
        prefix: 'S',
        totalRooms: 25,
        pricePerNight: 4999,
        description: 'Our Standard Rooms in Mumbai offer city views, comfortable beds, and all essential amenities for a pleasant stay in the heart of the city.',
        amenities: [
          'Double Bed',
          'En-suite Bathroom',
          '32" TV',
          'Work Space',
          'Air Conditioning',
          'Daily Housekeeping'
        ],
        maxGuests: 3,
        bedType: 'Double Bed',
        roomSize: '28 sq m'
      },
      'Deluxe Room': {
        prefix: 'D',
        totalRooms: 20,
        pricePerNight: 6999,
        description: 'Our Mumbai Deluxe Rooms feature partial sea views, premium furnishings, and enhanced amenities for those seeking extra comfort.',
        amenities: [
          'Queen Size Bed',
          'Partial Sea View',
          'Modern Bathroom',
          '43" Smart TV',
          'Work Desk',
          'Tea/Coffee Maker'
        ],
        maxGuests: 3,
        bedType: 'Queen Size Bed',
        roomSize: '35 sq m'
      },
      'Master Suite': {
        prefix: 'M',
        totalRooms: 20,
        pricePerNight: 11999,
        description: 'Our Mumbai Master Suites offer stunning sea views, separate living areas, and luxury amenities for a truly exceptional stay.',
        amenities: [
          'King-Size Bed',
          'Private Balcony with Sea View',
          'Luxury Bathroom with Jacuzzi',
          '55" Smart TV',
          'Spacious Living Area',
          'Complimentary Breakfast and Evening Cocktails'
        ],
        maxGuests: 4,
        bedType: 'King Size Bed',
        roomSize: '50 sq m'
      },
      'Honeymoon Suite': {
        prefix: 'H',
        totalRooms: 15,
        pricePerNight: 14999,
        description: 'Our Mumbai Honeymoon Suites feature panoramic ocean views, luxury amenities, and special romantic touches for couples celebrating their love.',
        amenities: [
          'King-Size Canopy Bed',
          'Private Balcony with Panoramic Sea Views',
          'Elegant Marble Bathroom with Spa Tub',
          'Mood Lighting',
          'Premium Champagne Service',
          'Private Dining Experience'
        ],
        maxGuests: 2,
        bedType: 'King Size Canopy Bed',
        roomSize: '55 sq m'
      }
    }
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    location: {
      address: '789 Riverfront Road, Navrangpura',
      city: 'Ahmedabad',
      state: 'Gujarat',
      zipCode: '380009',
      country: 'India',
      coordinates: {
        latitude: 23.0225,
        longitude: 72.5714
      }
    },
    contactInfo: {
      phone: '+91 98765 43212',
      email: 'ahmedabad@solacestay.com',
      websiteUrl: 'https://solacestay.com/ahmedabad'
    },
    amenities: [
      'Indoor Pool',
      'Ayurvedic Spa',
      'Vegetarian Restaurant',
      'Free WiFi',
      'Room Service',
      'Free Parking',
      'Business Hub',
      'Yoga Center'
    ],
    images: [],
    rating: 4.6,
    totalRooms: 60,
    roomTypes: {
      'Standard Room': {
        prefix: 'S',
        totalRooms: 20,
        pricePerNight: 3499,
        description: 'Our Ahmedabad Standard Rooms combine modern comfort with traditional Gujarati design elements for a unique and pleasant stay experience.',
        amenities: [
          'Double Bed',
          'En-suite Bathroom',
          '32" TV',
          'Work Space',
          'Air Conditioning',
          'Daily Housekeeping'
        ],
        maxGuests: 3,
        bedType: 'Double Bed',
        roomSize: '25 sq m'
      },
      'Deluxe Room': {
        prefix: 'D',
        totalRooms: 15,
        pricePerNight: 5499,
        description: 'Our Ahmedabad Deluxe Rooms feature riverfront views, locally inspired decor, and enhanced comfort for business and leisure travelers.',
        amenities: [
          'Queen Size Bed',
          'Riverfront View',
          'Modern Bathroom',
          '43" Smart TV',
          'Work Desk',
          'Tea/Coffee Maker'
        ],
        maxGuests: 3,
        bedType: 'Queen Size Bed',
        roomSize: '30 sq m'
      },
      'Master Suite': {
        prefix: 'M',
        totalRooms: 15,
        pricePerNight: 8999,
        description: 'Our Ahmedabad Master Suites offer spacious accommodations with separate living areas, luxurious amenities, and views of the Sabarmati Riverfront.',
        amenities: [
          'King-Size Bed',
          'Private Balcony with Riverfront View',
          'Luxury Bathroom with Jacuzzi',
          '55" Smart TV',
          'Spacious Living Area',
          'Complimentary Breakfast and Evening Snacks'
        ],
        maxGuests: 4,
        bedType: 'King Size Bed',
        roomSize: '45 sq m'
      },
      'Honeymoon Suite': {
        prefix: 'H',
        totalRooms: 10,
        pricePerNight: 10999,
        description: 'Our Ahmedabad Honeymoon Suites feature elegant decor with traditional Gujarati elements, premium amenities, and special touches for a romantic getaway.',
        amenities: [
          'King-Size Canopy Bed',
          'Private Balcony with Riverfront Views',
          'Elegant Marble Bathroom with Spa Tub',
          'Mood Lighting',
          'Premium Welcome Package',
          'Private Dining Area'
        ],
        maxGuests: 2,
        bedType: 'King Size Canopy Bed',
        roomSize: '50 sq m'
      }
    }
  }
];

export const initializeBranches = async () => {
  try {
    // First, clean up old collections
    // 1. Delete existing roomTypes collection
    const roomTypesRef = collection(db, 'roomTypes');
    const roomTypesSnapshot = await getDocs(roomTypesRef);
    const deletePromises = [];
    
    roomTypesSnapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('Old roomTypes collection cleaned up');
    
    // 2. Create branches collection with room types
    for (const branch of branchesData) {
      await setDoc(doc(db, 'branches', branch.id), branch);
      
      // Generate individual rooms for each branch
      for (const [roomTypeName, roomTypeData] of Object.entries(branch.roomTypes)) {
        for (let i = 1; i <= roomTypeData.totalRooms; i++) {
          const roomNumber = `${roomTypeData.prefix}${i.toString().padStart(3, '0')}`;
          const roomId = `${branch.id}-${roomNumber}`;
          
          await setDoc(doc(db, 'rooms', roomId), {
            roomId,
            roomNumber,
            roomType: roomTypeName,
            branch: branch.id,
            branchName: branch.name,
            pricePerNight: roomTypeData.pricePerNight,
            description: roomTypeData.description,
            amenities: roomTypeData.amenities,
            maxGuests: roomTypeData.maxGuests,
            bedType: roomTypeData.bedType,
            roomSize: roomTypeData.roomSize,
            isAvailable: true,
            isBooked: false,
            currentBookingId: null,
            lastBookingDate: null,
            maintenanceStatus: 'operational',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    console.log('Branch data and individual rooms initialized successfully');
  } catch (error) {
    console.error('Error initializing branch data:', error);
  }
};