import { db, auth } from './firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// Add a new track
export const addTrack = async (name, latitude, longitude) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to add tracks');
  }

  try {
    await addDoc(collection(db, 'tracks'), {
      userId: auth.currentUser.uid,
      name,
      latitude,
      longitude,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error adding track:', error);
    throw error;
  }
};

// Get user's tracks
export const getUserTracks = async () => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to view tracks');
  }

  try {
    const q = query(
      collection(db, 'tracks'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tracks:', error);
    throw error;
  }
};

// Update a track
export const updateTrack = async (trackId, name, latitude, longitude) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to update tracks');
  }

  try {
    const trackRef = doc(db, 'tracks', trackId);
    await updateDoc(trackRef, {
      name,
      latitude,
      longitude,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating track:', error);
    throw error;
  }
};

// Delete a track
export const deleteTrack = async (trackId) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to delete tracks');
  }

  try {
    await deleteDoc(doc(db, 'tracks', trackId));
  } catch (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
};

// Get current location using browser's geolocation API
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
