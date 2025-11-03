import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.js';
import { user } from './stores.js';
import { get } from 'svelte/store';

export const addChassis = async (chassisData) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to add chassis');
  }

  const docRef = await addDoc(collection(db, 'chassis'), {
    ...chassisData,
    userId: currentUser.uid,
    createdAt: Timestamp.now(),
    retired: false
  });

  return docRef.id;
};

export const getUserChassis = async () => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to view chassis');
  }

  const q = query(
    collection(db, 'chassis'),
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateChassis = async (chassisId, updates) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to update chassis');
  }

  const chassisRef = doc(db, 'chassis', chassisId);
  await updateDoc(chassisRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteChassis = async (chassisId) => {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be logged in to delete chassis');
  }

  const chassisRef = doc(db, 'chassis', chassisId);
  await deleteDoc(chassisRef);
};

export const retireChassis = async (chassisId) => {
  await updateChassis(chassisId, { retired: true });
};
