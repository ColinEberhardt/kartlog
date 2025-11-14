// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCaj9kpUp4nUIABWqByS1ZPkdtEGMm46NQ",
  authDomain: "karting-tracker-59e58.firebaseapp.com",
  projectId: "karting-tracker-59e58",
  storageBucket: "karting-tracker-59e58.firebasestorage.app",
  messagingSenderId: "119257842195",
  appId: "1:119257842195:web:c0af490875be2e313eb5e6",
  measurementId: "G-KRX5EZ3Z72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
