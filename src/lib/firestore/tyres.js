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

// Add a new tyre
export const addTyre = async (name, make, type, description, retired) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to add tyres');
  }

  try {
    await addDoc(collection(db, 'tyres'), {
      userId: auth.currentUser.uid,
      name,
      make,
      type,
      description: description || '',
      retired: retired || false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error adding tyre:', error);
    throw error;
  }
};

// Get user's tyres
export const getUserTyres = async () => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to view tyres');
  }

  try {
    const q = query(
      collection(db, 'tyres'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tyres:', error);
    throw error;
  }
};

// Update a tyre
export const updateTyre = async (tyreId, name, make, type, description, retired) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to update tyres');
  }

  try {
    const tyreRef = doc(db, 'tyres', tyreId);
    await updateDoc(tyreRef, {
      name,
      make,
      type,
      description: description || '',
      retired: retired || false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating tyre:', error);
    throw error;
  }
};

// Delete a tyre
export const deleteTyre = async (tyreId) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to delete tyres');
  }

  try {
    await deleteDoc(doc(db, 'tyres', tyreId));
  } catch (error) {
    console.error('Error deleting tyre:', error);
    throw error;
  }
};

// Retire a tyre (mark as retired without deleting)
export const retireTyre = async (tyreId) => {
  if (!auth.currentUser) {
    throw new Error('User must be logged in to retire tyres');
  }

  try {
    const tyreRef = doc(db, 'tyres', tyreId);
    await updateDoc(tyreRef, {
      retired: true,
      retiredAt: new Date()
    });
  } catch (error) {
    console.error('Error retiring tyre:', error);
    throw error;
  }
};
