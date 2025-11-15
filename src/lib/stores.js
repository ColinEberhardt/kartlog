import { writable } from 'svelte/store';
import { auth, onAuthStateChanged } from './firebase.js';

// Create a writable store for the current user
export const user = writable(null);
export const loading = writable(true);

// Initialize auth listener based on environment
const useMock = import.meta.env.VITE_USE_MOCK_FIRESTORE === 'true';

if (useMock) {
  // For mock, we don't use onAuthStateChanged since it's not fully implemented
  // The mock user is set in main.js
  const checkAuth = () => {
    if (auth.currentUser) {
      user.set(auth.currentUser);
    }
    loading.set(false);
  };
  // Check immediately and set up a small delay to catch the mock user from main.js
  checkAuth();
  setTimeout(checkAuth, 100);
} else {
  // Listen for authentication state changes
  onAuthStateChanged(auth, (currentUser) => {
    user.set(currentUser);
    loading.set(false);
  });
}
