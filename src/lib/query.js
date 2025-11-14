// @ts-nocheck
import alasql from 'alasql';
import { getUserTyres } from './firestore/tyres.js';
import { getUserEngines } from './firestore/engines.js';
import { getUserChassis } from './firestore/chassis.js';
import { getUserSessions } from './firestore/sessions.js';
import { getUserTracks } from './firestore/tracks.js';

// Global database instance
let db = null;
let isInitialized = false;

/**
 * Flatten nested objects for SQL storage
 * Converts nested objects like { tyre: { name: 'X' } } to { tyre_name: 'X' }
 * Also renames reserved SQL keywords to avoid conflicts
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  // Map of reserved keywords to safe column names
  const reservedKeywordMap = {
    'date': 'session_date',
    'temp': 'temperature',
    'session': 'session_type',
    'order': 'order_value',
    'group': 'group_value',
    'table': 'table_value',
    'key': 'key_value',
    'user': 'user_value',
    'index': 'index_value'
  };
  
  for (const [key, value] of Object.entries(obj)) {
    // Rename reserved keywords at the root level
    let safeName = key;
    if (!prefix && reservedKeywordMap[key.toLowerCase()]) {
      safeName = reservedKeywordMap[key.toLowerCase()];
    }
    
    const newKey = prefix ? `${prefix}_${safeName}` : safeName;
    
    if (value === null || value === undefined) {
      flattened[newKey] = null;
    } else if (value instanceof Date) {
      flattened[newKey] = value.toISOString();
    } else if (typeof value === 'object' && value.seconds !== undefined) {
      // Handle Firestore Timestamp objects - convert to ISO string
      flattened[newKey] = new Date(value.seconds * 1000).toISOString();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      // Store arrays as JSON strings
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Initialize the in-memory database with all user data
 * This loads tyres, engines, chassis, tracks, and sessions into SQL tables
 */
export async function initializeDatabase() {
  try {
    // Create a new database instance
    db = new alasql.Database();
    
    // Load all data in parallel
    const [tyres, engines, chassis, tracks, sessions] = await Promise.all([
      getUserTyres(),
      getUserEngines(),
      getUserChassis(),
      getUserTracks(),
      getUserSessions(true) // true = join related data
    ]);

    // Create and populate tyres table
    db.exec('CREATE TABLE tyres (id STRING, name STRING, make STRING, type STRING, description STRING, retired BOOLEAN, createdAt STRING)');
    if (tyres.length > 0) {
      const tyresData = tyres.map(t => ({
        id: t.id,
        name: t.name || null,
        make: t.make || null,
        type: t.type || null,
        description: t.description || null,
        retired: t.retired || false,
        createdAt: t.createdAt ? new Date(t.createdAt.seconds * 1000).toISOString() : null
      }));
      db.exec('INSERT INTO tyres SELECT * FROM ?', [tyresData]);
    }

    // Create and populate engines table
    db.exec('CREATE TABLE engines (id STRING, name STRING, make STRING, model STRING, serialNumber STRING, description STRING, retired BOOLEAN, createdAt STRING)');
    if (engines.length > 0) {
      const enginesData = engines.map(e => ({
        id: e.id,
        name: e.name || null,
        make: e.make || null,
        model: e.model || null,
        serialNumber: e.serialNumber || null,
        description: e.description || null,
        retired: e.retired || false,
        createdAt: e.createdAt ? new Date(e.createdAt.seconds * 1000).toISOString() : null
      }));
      db.exec('INSERT INTO engines SELECT * FROM ?', [enginesData]);
    }

    // Create and populate chassis table
    db.exec('CREATE TABLE chassis (id STRING, name STRING, make STRING, model STRING, serialNumber STRING, description STRING, retired BOOLEAN, createdAt STRING)');
    if (chassis.length > 0) {
      const chassisData = chassis.map(c => ({
        id: c.id,
        name: c.name || null,
        make: c.make || null,
        model: c.model || null,
        serialNumber: c.serialNumber || null,
        description: c.description || null,
        retired: c.retired || false,
        createdAt: c.createdAt ? new Date(c.createdAt.seconds * 1000).toISOString() : null
      }));
      db.exec('INSERT INTO chassis SELECT * FROM ?', [chassisData]);
    }

    // Create and populate tracks table
    db.exec('CREATE TABLE tracks (id STRING, name STRING, latitude FLOAT, longitude FLOAT, createdAt STRING)');
    if (tracks.length > 0) {
      const tracksData = tracks.map(t => ({
        id: t.id,
        name: t.name || null,
        latitude: t.latitude || null,
        longitude: t.longitude || null,
        createdAt: t.createdAt ? new Date(t.createdAt.seconds * 1000).toISOString() : null
      }));
      db.exec('INSERT INTO tracks SELECT * FROM ?', [tracksData]);
    }

    // Create and populate sessions table with flattened nested objects
    // This includes all session data plus denormalized equipment and track info
    if (sessions.length > 0) {
      const flatSessions = sessions.map(s => flattenObject(s));
      
      // Dynamically create columns based on the first session's keys
      if (flatSessions.length > 0) {
        const sampleSession = flatSessions[0];
        
        const columns = Object.keys(sampleSession).map(key => {
          const value = sampleSession[key];
          let type = 'STRING';
          
          if (typeof value === 'number') {
            type = 'FLOAT';
          } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
          }
          
          return `${key} ${type}`;
        }).join(', ');
        
        db.exec(`CREATE TABLE sessions (${columns})`);
        db.exec('INSERT INTO sessions SELECT * FROM ?', [flatSessions]);
      }
    } else {
      // Create empty sessions table with basic structure
      db.exec(`CREATE TABLE sessions (
        id STRING, 
        session_date STRING, 
        circuit_id STRING, 
        circuit_name STRING,
        temperature FLOAT,
        weatherCode INT,
        session_type STRING,
        tyre_id STRING,
        tyre_name STRING,
        tyre_make STRING,
        tyre_type STRING,
        engine_id STRING,
        engine_name STRING,
        engine_make STRING,
        engine_model STRING,
        chassis_id STRING,
        chassis_name STRING,
        chassis_make STRING,
        chassis_model STRING,
        rearSprocket INT,
        frontSprocket INT,
        caster STRING,
        rideHeight STRING,
        jet INT,
        rearInner FLOAT,
        rearOuter FLOAT,
        frontInner FLOAT,
        frontOuter FLOAT,
        laps INT,
        fastest FLOAT,
        isRace BOOLEAN,
        entries INT,
        startPos INT,
        endPos INT,
        penalties STRING,
        notes STRING
      )`);
    }

    isInitialized = true;
    console.log('Database initialized successfully');
    console.log(`Loaded: ${tyres.length} tyres, ${engines.length} engines, ${chassis.length} chassis, ${tracks.length} tracks, ${sessions.length} sessions`);
    
    return {
      tyres: tyres.length,
      engines: engines.length,
      chassis: chassis.length,
      tracks: tracks.length,
      sessions: sessions.length
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Execute a SQL query on the in-memory database
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Optional parameters for parameterized queries
 * @returns {Array} Query results
 */
export function query(sql, params = []) {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  try {
    return db.exec(sql, params);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Get list of all tables in the database
 * @returns {Array} List of table names
 */
export function getTables() {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  return ['tyres', 'engines', 'chassis', 'tracks', 'sessions'];
}

/**
 * Get schema information for a specific table
 * @param {string} tableName - Name of the table
 * @returns {Array} Column information
 */
export function getTableSchema(tableName) {
  if (!isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  try {
    // alasql doesn't have a standard way to get schema, so we'll query the table
    const result = db.exec(`SELECT * FROM ${tableName} LIMIT 1`);
    if (result.length === 0) {
      return [];
    }
    
    // Return column names and inferred types
    const sample = result[0];
    return Object.keys(sample).map(key => ({
      column: key,
      type: typeof sample[key]
    }));
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
}

/**
 * Reset the database (useful for testing or refreshing data)
 */
export function resetDatabase() {
  db = null;
  isInitialized = false;
}

/**
 * Check if database is initialized
 * @returns {boolean}
 */
export function isDatabaseInitialized() {
  return isInitialized;
}

/**
 * Refresh database with latest data from Firestore
 */
export async function refreshDatabase() {
  resetDatabase();
  return await initializeDatabase();
}
