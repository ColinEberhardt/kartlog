// Centralized Firebase module that automatically loads mock or real implementation
// This is the SINGLE place where we check the environment and load the correct Firebase

const useMock = import.meta.env.VITE_USE_MOCK_FIRESTORE === 'true';

let auth, db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot;
let setMockUser, clearMockUser, clearMockData, exportMockData, importMockData;

if (useMock) {
  // Load mock Firebase - everything comes from one module
  const firebaseModule = await import('./firestore-mock/firebase.js');
  auth = firebaseModule.auth;
  db = firebaseModule.db;
  collection = firebaseModule.collection;
  addDoc = firebaseModule.addDoc;
  getDocs = firebaseModule.getDocs;
  getDoc = firebaseModule.getDoc;
  doc = firebaseModule.doc;
  updateDoc = firebaseModule.updateDoc;
  deleteDoc = firebaseModule.deleteDoc;
  query = firebaseModule.query;
  where = firebaseModule.where;
  orderBy = firebaseModule.orderBy;
  Timestamp = firebaseModule.Timestamp;
  onSnapshot = firebaseModule.onSnapshot;
  setMockUser = firebaseModule.setMockUser;
  clearMockUser = firebaseModule.clearMockUser;
  clearMockData = firebaseModule.clearMockData;
  exportMockData = firebaseModule.exportMockData;
  importMockData = firebaseModule.importMockData;
} else {
  // Load real Firebase - auth/db from one module, Firestore functions from another
  const firebaseModule = await import('./firestore/firebase.js');
  const firestoreModule = await import('firebase/firestore');
  
  auth = firebaseModule.auth;
  db = firebaseModule.db;
  collection = firestoreModule.collection;
  addDoc = firestoreModule.addDoc;
  getDocs = firestoreModule.getDocs;
  getDoc = firestoreModule.getDoc;
  doc = firestoreModule.doc;
  updateDoc = firestoreModule.updateDoc;
  deleteDoc = firestoreModule.deleteDoc;
  query = firestoreModule.query;
  where = firestoreModule.where;
  orderBy = firestoreModule.orderBy;
  Timestamp = firestoreModule.Timestamp;
  onSnapshot = firestoreModule.onSnapshot;
}

// Export all the loaded functions
export { auth, db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot };
export { setMockUser, clearMockUser, clearMockData, exportMockData, importMockData };

// Firebase Auth functions
let signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider;

if (useMock) {
  // Mock doesn't need separate auth functions - they're all in the mock module
  signInWithEmailAndPassword = async () => { /* Mock user already set */ };
  createUserWithEmailAndPassword = async () => { /* Mock user already set */ };
  signInWithPopup = async () => { /* Mock user already set */ };
  signOut = async (auth) => { auth.signOut(); };
  onAuthStateChanged = () => {}; // Mock doesn't use this
  GoogleAuthProvider = class {};
} else {
  // Import real Firebase auth functions
  const firebaseAuth = await import('firebase/auth');
  signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
  createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
  signInWithPopup = firebaseAuth.signInWithPopup;
  signOut = firebaseAuth.signOut;
  onAuthStateChanged = firebaseAuth.onAuthStateChanged;
  GoogleAuthProvider = firebaseAuth.GoogleAuthProvider;
}

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider };

console.log(useMock ? '🔧 Centralized Firebase module loaded: MOCK' : '🔥 Centralized Firebase module loaded: REAL');
