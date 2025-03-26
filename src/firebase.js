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

export { db, auth, functions };