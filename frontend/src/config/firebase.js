import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADGzP6nVEo6VVEzIfmNvYXpL1jSdg6jvA",
  authDomain: "safehome-92f39.firebaseapp.com",
  projectId: "safehome-92f39",
  storageBucket: "safehome-92f39.firebasestorage.app",
  messagingSenderId: "772417643036",
  appId: "1:772417643036:web:e8d63daaba3ab0430a75d9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
