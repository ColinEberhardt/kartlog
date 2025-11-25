// Mock Firebase/Firestore implementation using localStorage
// This mocks the Firebase API so the existing firestore modules can be reused

// ============================================================================
// Mock Database Storage
// ============================================================================

class MockDB {
  constructor() {
    this.collections = new Map();
    this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem('mockFirestoreData');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([collectionName, docs]) => {
          this.collections.set(collectionName, new Map(Object.entries(docs)));
        });
      }
    } catch (error) {
      console.warn('Failed to load mock data from localStorage:', error);
    }
  }

  saveData() {
    try {
      const data = {};
      this.collections.forEach((docs, collectionName) => {
        data[collectionName] = Object.fromEntries(docs);
      });
      localStorage.setItem('mockFirestoreData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save mock data to localStorage:', error);
    }
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name);
  }

  clearAll() {
    this.collections.clear();
    localStorage.removeItem('mockFirestoreData');
  }
}

// Global mock database instance
const mockDB = new MockDB();

// ============================================================================
// Mock Authentication
// ============================================================================

class MockAuth {
  constructor() {
    this._currentUser = null;
  }

  get currentUser() {
    return this._currentUser;
  }

  setCurrentUser(user) {
    this._currentUser = user;
  }

  signOut() {
    this._currentUser = null;
  }
}

// Global mock auth instance
const mockAuth = new MockAuth();

// ============================================================================
// Mock Firebase/Firestore API Functions
// ============================================================================

// Generate unique ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Mock collection reference
export const collection = (db, collectionName) => {
  return { _collectionName: collectionName };
};

// Mock addDoc
export const addDoc = async (collectionRef, data) => {
  const collectionName = collectionRef._collectionName;
  const coll = mockDB.getCollection(collectionName);
  const id = generateId();
  
  const doc = {
    ...data,
    // Convert Timestamps to Dates
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || new Date()
  };
  
  coll.set(id, doc);
  mockDB.saveData();
  
  return { id };
};

// Mock getDocs
export const getDocs = async (queryObj) => {
  const collectionName = queryObj._collectionName;
  const coll = mockDB.getCollection(collectionName);
  
  let docs = Array.from(coll.entries()).map(([id, data]) => ({
    id,
    data: () => data,
    exists: () => true
  }));
  
  // Apply where filters
  if (queryObj._where) {
    docs = docs.filter(doc => {
      const data = doc.data();
      return queryObj._where.every(w => {
        const [field, op, value] = w;
        if (op === '==') return data[field] === value;
        if (op === '!=') return data[field] !== value;
        if (op === '<') return data[field] < value;
        if (op === '<=') return data[field] <= value;
        if (op === '>') return data[field] > value;
        if (op === '>=') return data[field] >= value;
        return true;
      });
    });
  }
  
  // Apply orderBy
  if (queryObj._orderBy) {
    queryObj._orderBy.forEach(([field, direction]) => {
      docs.sort((a, b) => {
        const aVal = a.data()[field];
        const bVal = b.data()[field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return direction === 'desc' ? -comparison : comparison;
      });
    });
  }
  
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length
  };
};

// Mock getDoc
export const getDoc = async (docRef) => {
  const collectionName = docRef._collectionName;
  const docId = docRef._docId;
  const coll = mockDB.getCollection(collectionName);
  const data = coll.get(docId);
  
  return {
    id: docId,
    exists: () => !!data,
    data: () => data
  };
};

// Mock doc
export const doc = (db, collectionName, docId) => {
  return { _collectionName: collectionName, _docId: docId };
};

// Mock updateDoc
export const updateDoc = async (docRef, updates) => {
  const collectionName = docRef._collectionName;
  const docId = docRef._docId;
  const coll = mockDB.getCollection(collectionName);
  const existing = coll.get(docId);
  
  if (!existing) {
    throw new Error('Document not found');
  }
  
  const updated = {
    ...existing,
    ...updates,
    updatedAt: updates.updatedAt?.toDate ? updates.updatedAt.toDate() : updates.updatedAt || new Date()
  };
  
  coll.set(docId, updated);
  mockDB.saveData();
};

// Mock deleteDoc
export const deleteDoc = async (docRef) => {
  const collectionName = docRef._collectionName;
  const docId = docRef._docId;
  const coll = mockDB.getCollection(collectionName);
  
  coll.delete(docId);
  mockDB.saveData();
};

// Mock query
export const query = (collectionRef, ...constraints) => {
  const queryObj = { 
    _collectionName: collectionRef._collectionName,
    _where: [],
    _orderBy: []
  };
  
  constraints.forEach(constraint => {
    if (constraint._type === 'where') {
      queryObj._where.push(constraint._constraint);
    } else if (constraint._type === 'orderBy') {
      queryObj._orderBy.push(constraint._constraint);
    }
  });
  
  return queryObj;
};

// Mock where
export const where = (field, op, value) => {
  return {
    _type: 'where',
    _constraint: [field, op, value]
  };
};

// Mock orderBy
export const orderBy = (field, direction = 'asc') => {
  return {
    _type: 'orderBy',
    _constraint: [field, direction]
  };
};

// Mock Timestamp
export const Timestamp = {
  now: () => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  }),
  fromDate: (date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0
  })
};

// Mock onSnapshot - simplified version that calls callback immediately and on storage changes
export const onSnapshot = (queryObj, callback, errorCallback) => {
  // Initial call with current data
  getDocs(queryObj).then(snapshot => {
    callback(snapshot);
  }).catch(error => {
    if (errorCallback) errorCallback(error);
  });
  
  // Listen for storage changes (simplified - real version would use more sophisticated approach)
  const storageListener = (event) => {
    if (event.key === 'mockFirestoreData') {
      getDocs(queryObj).then(snapshot => {
        callback(snapshot);
      }).catch(error => {
        if (errorCallback) errorCallback(error);
      });
    }
  };
  
  window.addEventListener('storage', storageListener);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', storageListener);
  };
};

// ============================================================================
// Mock Firebase App
// ============================================================================

const mockApp = {
  name: '[MOCK]',
  options: {
    projectId: 'mock-project'
  }
};

export const initializeApp = (config) => {
  console.log('Mock Firebase initialized with config:', config);
  return mockApp;
};

export const getAuth = (app) => {
  return mockAuth;
};

export const getFirestore = (app) => {
  return mockDB;
};

// ============================================================================
// Exports for direct use (compatible with real Firebase)
// ============================================================================

export const auth = mockAuth;
export const db = mockDB;

// ============================================================================
// Test Helpers
// ============================================================================

export const setMockUser = (userId = 'test-user-1') => {
  mockAuth.setCurrentUser({
    uid: userId,
    email: `${userId}@test.com`
  });
};

export const clearMockUser = () => {
  mockAuth.signOut();
};

export const clearMockData = () => {
  mockDB.clearAll();
};

export const exportMockData = () => {
  const data = {};
  mockDB.collections.forEach((docs, collectionName) => {
    data[collectionName] = Array.from(docs.values());
  });
  return data;
};

export const importMockData = (data) => {
  mockDB.clearAll();
  Object.entries(data).forEach(([collectionName, docs]) => {
    const coll = mockDB.getCollection(collectionName);
    docs.forEach(doc => {
      coll.set(doc.id, doc);
    });
  });
  mockDB.saveData();
};

export default mockApp;
