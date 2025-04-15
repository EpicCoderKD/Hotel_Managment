// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACdUOyFp6APVDSNR-n6qP8BNxJrOdpnhk",
  authDomain: "hotel-mangement-2931d.firebaseapp.com",
  projectId: "hotel-mangement-2931d",
  storageBucket: "hotel-mangement-2931d.firebasestorage.app",
  messagingSenderId: "669902541469",
  appId: "1:669902541469:web:b9416774fe398c74e23a74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Functions
const functions = getFunctions(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  try {
    db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // The current browser doesn't support persistence
          console.log('Persistence not supported by browser');
        }
      });
  } catch (error) {
    console.error('Error enabling persistence:', error);
  }
}

export { db, auth, functions };