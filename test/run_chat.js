#!/usr/bin/env node

/**
 * Node.js script to test chat functionality with mocked dependencies
 * This script mocks localStorage and Firebase functions to test the chat logic
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock localStorage
global.localStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
  },
  removeItem(key) {
    delete this.storage[key];
  }
};

// Mock Firebase data functions
const mockTyres = [
  {
    id: 'tyre1',
    name: 'Bridgestone YDS',
    make: 'Bridgestone',
    type: 'slick',
    description: 'Dry weather slicks',
    retired: false
  }
];

const mockEngines = [
  {
    id: 'engine1',
    name: 'IAME X30',
    make: 'IAME',
    model: 'X30',
    serialNumber: 'X30-12345',
    description: 'Primary race engine',
    retired: false
  }
];

const mockChassis = [
  {
    id: 'chassis1',
    name: 'Tony Kart Racer',
    make: 'Tony Kart',
    model: 'Racer 401R',
    serialNumber: 'TK-98765',
    description: 'Main chassis',
    retired: false
  }
];

const mockTracks = [
  {
    id: 'track1',
    name: 'Silverstone',
    location: 'UK',
    length: 1200
  }
];

const mockSessions = [
  {
    id: 'session1',
    date: '2025-11-01',
    circuitId: 'track1',
    tyreId: 'tyre1',
    engineId: 'engine1',
    chassisId: 'chassis1',
    session: 'Practice',
    temp: 15,
    weatherCode: 'sunny',
    rearSprocket: 88,
    frontSprocket: 12,
    fastest: 45.2,
    laps: 10,
    notes: 'Good session'
  }
];

// Mock the Firebase modules
const mockModules = {
  '../src/lib/tyres.js': {
    getUserTyres: async () => mockTyres
  },
  '../src/lib/engines.js': {
    getUserEngines: async () => mockEngines
  },
  '../src/lib/chassis.js': {
    getUserChassis: async () => mockChassis
  },
  '../src/lib/tracks.js': {
    getUserTracks: async () => mockTracks
  },
  '../src/lib/sessions.js': {
    getUserSessions: async () => mockSessions
  }
};

// Setup module mocking
const Module = await import('module');
const originalRequire = Module.default.createRequire(import.meta.url);
const originalResolveFilename = Module.default._resolveFilename;

Module.default._resolveFilename = function(request, parent, isMain) {
  if (mockModules[request]) {
    return request;
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

// Suppress all console output for cleaner JSON output
const originalConsole = {
  log: console.log,
  error: console.error
};
console.log = () => {};
console.error = () => {};

// Now import the chat module
const chatModule = await import('../src/lib/chat.js');
const { sendChatMessage, initializeConversation } = chatModule;

// Restore console for final output only
console.log = originalConsole.log;
console.error = originalConsole.error;

// Main function to run the chat
async function runChat(userMessage, apiKey) {
  try {
    // Initialize conversation
    const messages = initializeConversation();
    
    // Add user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Send message and get response
    const response = await sendChatMessage(messages, null, null, apiKey);
    
    return {
      success: true,
      response: response.content
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node run_chat.js "<user message>" [api_key]');
  process.exit(1);
}

const userMessage = args[0];
const apiKey = args[1] || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: No API key provided. Set OPENAI_API_KEY environment variable or pass as second argument.');
  process.exit(1);
}

// Run the chat
runChat(userMessage, apiKey)
  .then(result => {
    if (result.success) {
      console.log(result.response);
      process.exit(0);
    } else {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
