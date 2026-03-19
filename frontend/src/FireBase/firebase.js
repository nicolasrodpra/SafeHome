// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { getFirestore }  from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADGzP6nVEo6VVEzIfmNvYXpL1jSdg6jvA",
  authDomain: "safehome-92f39.firebaseapp.com",
  projectId: "safehome-92f39",
  storageBucket: "safehome-92f39.firebasestorage.app",
  messagingSenderId: "772417643036",
  appId: "1:772417643036:web:e8d63daaba3ab0430a75d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);