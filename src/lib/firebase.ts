import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAdwXUNViQIS0jCa1IwZfehPZD0az7cZJs",
  authDomain: "contractor-93f20.firebaseapp.com",
  projectId: "contractor-93f20",
  storageBucket: "contractor-93f20.firebasestorage.app",
  messagingSenderId: "695480164637",
  appId: "1:695480164637:web:7046aefdfb6485a90fc1f4",
  measurementId: "G-057KYSQE5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;