import './app.css'

// Initialize mock data if using mock Firestore - MUST happen before app mounts
if (import.meta.env.VITE_USE_MOCK_FIRESTORE === 'true') {
  const { setMockUser, importMockData, exportMockData } = await import('./lib/firebase.js');
  const { generateCompleteTestData } = await import('./lib/firestore-mock/testData.js');
  
  // Set up mock user
  setMockUser('test-user-1');
  
  // Load test data if not already present
  const existingData = exportMockData();
  const hasData = Object.values(existingData).some(collection => collection.length > 0);
  
  if (!hasData) {
    const testData = generateCompleteTestData('test-user-1');
    importMockData(testData);
  }
}

// Import App and mount after mock is initialized
const { mount } = await import('svelte');
const { default: App } = await import('./App.svelte');

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
