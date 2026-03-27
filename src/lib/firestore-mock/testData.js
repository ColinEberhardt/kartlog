// Test data generator for mock Firestore
// Use this to generate realistic test data for UI testing and automation

// =============================================================================
// UTILITY FUNCTIONS FOR RANDOM DATA GENERATION
// =============================================================================

/**
 * Get random element from array
 */
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

/**
 * Generate random number between min and max (inclusive)
 */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate random float between min and max
 */
const randomFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

/**
 * Generate random date within the last year
 */
const randomDateLastYear = () => {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const timeDiff = now.getTime() - oneYearAgo.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(oneYearAgo.getTime() + randomTime);
};

/**
 * Generate random date within a specific range
 */
const randomDateInRange = (startDate, endDate) => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(startDate.getTime() + randomTime);
};

// =============================================================================
// REALISTIC DATA ARRAYS
// =============================================================================

const TYRE_DATA = {
  makes: ['Vega', 'Bridgestone', 'Dunlop', 'LeCont', 'Komet', 'Maxxis'],
  types: ['Dry', 'Slick'],
  colors: ['Red', 'Blue', 'Yellow', 'White', 'Green', 'Black'],
  compounds: ['Hard', 'Medium', 'Soft', 'Prime', 'Option']
};

const ENGINE_DATA = {
  makes: ['IAME', 'Rotax', 'Honda', 'KTM', 'TM Racing', 'Parilla'],
  models: {
    'IAME': ['X30', 'KA100', 'Leopard', 'Shifter'],
    'Rotax': ['Max', 'DD2', 'Micro Max', 'Mini Max'],
    'Honda': ['GX270', 'GX390', 'CR125'],
    'KTM': ['65 SX', '85 SX', '125 SX'],
    'TM Racing': ['K9B', 'K9C', 'KZ10C'],
    'Parilla': ['X30', 'Leopard', 'Sudam']
  },
  purposes: ['Race', 'Practice', 'Backup', 'Rental', 'Training']
};

const CHASSIS_DATA = {
  makes: ['Tony Kart', 'CRG', 'Birel ART', 'OTK', 'Kosmic', 'Exprit', 'Energy Corse', 'Sodi Kart'],
  models: {
    'Tony Kart': ['Racer 401S', 'Neos', 'Stinger', 'Krypton'],
    'CRG': ['Road Rebel', 'Heron', 'Blackbird', 'Centurion'],
    'Birel ART': ['RY30-S8', 'AM29-S8', 'RY32-S11'],
    'OTK': ['FA Kart', 'Kosmic', 'Tony Kart', 'Exprit'],
    'Kosmic': ['Lynx', 'Mercury', 'Predator'],
    'Exprit': ['Rookie', 'Noesis', 'Dark'],
    'Energy Corse': ['Storm', 'Corse', 'Neo'],
    'Sodi Kart': ['GT5', 'Sigma DD2', 'RT8']
  }
};

const TRACK_DATA = [
  { name: 'Buckmore Park', latitude: 51.3528, longitude: 0.4917, country: 'UK' },
  { name: 'Rye House', latitude: 51.7698, longitude: -0.0249, country: 'UK' },
  { name: 'Daytona Sandown Park', latitude: 51.3667, longitude: -0.4000, country: 'UK' },
  { name: 'PF International', latitude: 52.6189, longitude: -1.2370, country: 'UK' },
  { name: 'Larkhall', latitude: 55.7333, longitude: -3.9667, country: 'UK' },
  { name: 'Three Sisters', latitude: 53.5167, longitude: -2.6333, country: 'UK' },
  { name: 'Fulbeck', latitude: 53.0167, longitude: -0.5833, country: 'UK' },
  { name: 'Clay Pigeon', latitude: 50.7167, longitude: -2.2833, country: 'UK' },
  { name: 'Whilton Mill', latitude: 52.1833, longitude: -1.0333, country: 'UK' },
  { name: 'Shenington', latitude: 52.0167, longitude: -1.3167, country: 'UK' }
];

const SESSION_DATA = {
  types: ['Practice', 'Qualifying', 'Heat 1', 'Heat 2', 'Pre-Final', 'Final', 'Warm-up', 'Free Practice'],
  weatherCodes: [0, 1, 2, 3], // Clear, Partly Cloudy, Cloudy, Rain
  notes: [
    'Good pace throughout the session',
    'Struggling with understeer in the hairpin',
    'Great grip today, kart felt perfect',
    'Had to pit early due to tire wear',
    'Traffic cost me 2 tenths on that last lap',
    'Personal best! Everything came together',
    'Rear end stepping out under braking',
    'Need more front wing for next session',
    'Consistent pace but lacking top speed',
    'Perfect balance in sector 2',
    'Lost time in the chicane complex',
    'Fantastic session, ready for qualifying',
    'Setup changes worked perfectly',
    'Could use more oversteer mid-corner',
    'Tires went off towards the end',
    'Clean laps with good rhythm',
    'Fighting oversteer on corner entry',
    'Found half a second with new setup',
    'Difficult conditions but good learning',
    'Excellent tire management today',
    'Need to work on braking points',
    'Kart was on rails through the esses',
    'Lost some pace with traffic',
    'Best session of the weekend so far',
    'Setup still needs fine tuning'
  ]
};

// =============================================================================
// SAMPLE DATA GENERATORS
// =============================================================================

/**
 * Generate 10 randomized tyres
 */
export const generateSampleTyres = (userId = 'test-user-1') => {
  return Array.from({ length: 10 }, (_, index) => {
    const make = randomChoice(TYRE_DATA.makes);
    const type = randomChoice(TYRE_DATA.types);
    const compound = randomChoice(TYRE_DATA.compounds);
    const color = randomChoice(TYRE_DATA.colors);
    const retired = Math.random() < 0.2; // 20% chance of being retired
    
    return {
      id: `tyre-${index + 1}`,
      userId,
      name: `${make} ${color} ${type} ${compound}`,
      make,
      type,
      description: `${compound} compound ${type.toLowerCase()} weather tyre`,
      retired,
      createdAt: randomDateLastYear()
    };
  });
};

/**
 * Generate 5 randomized engines
 */
export const generateSampleEngines = (userId = 'test-user-1') => {
  return Array.from({ length: 5 }, (_, index) => {
    const make = randomChoice(ENGINE_DATA.makes);
    const model = randomChoice(ENGINE_DATA.models[make]);
    const purpose = randomChoice(ENGINE_DATA.purposes);
    const serialPrefix = make.substring(0, 3).toUpperCase();
    const serialNumber = `${serialPrefix}-${randomInt(10000, 99999)}`;
    const retired = Math.random() < 0.1; // 10% chance of being retired
    
    return {
      id: `engine-${index + 1}`,
      userId,
      name: `${make} ${model} ${purpose}`,
      make,
      serialNumber,
      description: `${purpose.toLowerCase()} engine`,
      retired,
      createdAt: randomDateLastYear()
    };
  });
};

/**
 * Generate 3 randomized chassis
 */
export const generateSampleChassis = (userId = 'test-user-1') => {
  return Array.from({ length: 3 }, (_, index) => {
    const make = randomChoice(CHASSIS_DATA.makes);
    const model = randomChoice(CHASSIS_DATA.models[make]);
    const year = randomInt(2022, 2024);
    const serialPrefix = make.split(' ').map(word => word[0]).join('').substring(0, 3).toUpperCase();
    const serialNumber = `${serialPrefix}-${year}-${String(randomInt(1, 999)).padStart(3, '0')}`;
    const retired = Math.random() < 0.1; // 10% chance of being retired
    
    return {
      id: `chassis-${index + 1}`,
      userId,
      name: `${make} ${model}`,
      make,
      model,
      serialNumber,
      description: `${year} ${make} chassis`,
      retired,
      createdAt: randomDateLastYear()
    };
  });
};

/**
 * Generate 10 randomized tracks
 */
export const generateSampleTracks = (userId = 'test-user-1') => {
  return Array.from({ length: 10 }, (_, index) => {
    const track = TRACK_DATA[index % TRACK_DATA.length];
    // Add slight random variation to coordinates if we reuse tracks
    const latOffset = (Math.random() - 0.5) * 0.01; // Small offset
    const lonOffset = (Math.random() - 0.5) * 0.01; // Small offset
    
    return {
      id: `track-${index + 1}`,
      userId,
      name: track.name,
      latitude: track.latitude + latOffset,
      longitude: track.longitude + lonOffset,
      createdAt: randomDateLastYear()
    };
  });
};

/**
 * Generate 200 randomized sessions spanning a year
 */
export const generateSampleSessions = (userId = 'test-user-1') => {
  // Generate supporting data first to reference
  const tyres = generateSampleTyres(userId);
  const engines = generateSampleEngines(userId);
  const chassis = generateSampleChassis(userId);
  const tracks = generateSampleTracks(userId);
  
  // Date range for the full year
  const endDate = new Date();
  const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
  
  return Array.from({ length: 200 }, (_, index) => {
    // Random selections
    const track = randomChoice(tracks);
    const tyre = randomChoice(tyres);
    const engine = randomChoice(engines);
    const sessionType = randomChoice(SESSION_DATA.types);
    const weatherCode = randomChoice(SESSION_DATA.weatherCodes);
    const note = randomChoice(SESSION_DATA.notes);
    
    // Generate realistic session data
    const temp = randomInt(8, 32); // Racing season temperatures in Celsius
    const laps = sessionType === 'Qualifying' ? randomInt(5, 12) :
                sessionType.includes('Heat') ? randomInt(8, 15) :
                sessionType.includes('Final') || sessionType.includes('Pre-Final') ? randomInt(12, 25) :
                randomInt(10, 30); // Practice sessions
    
    // Generate realistic lap times (in seconds) - vary by track
    const baseTime = 45 + Math.random() * 30; // Base time between 45-75 seconds
    const fastest = randomFloat(baseTime, baseTime + 5, 3);
    
    // Realistic kart setup parameters
    const rearSprocket = randomInt(70, 85);
    const frontSprocket = randomInt(10, 14);
    const casterOptions = ['2.5', '3.0', '3.5', '4.0', '4.5'];
    const caster = randomChoice(casterOptions);
    const rideHeightOptions = ['4mm', '5mm', '6mm', '7mm', '8mm'];
    const rideHeight = randomChoice(rideHeightOptions);
    const jet = randomInt(115, 135);
    
    // Tire pressures (in bar)
    const rearInner = randomFloat(0.7, 1.0, 2);
    const rearOuter = randomFloat(0.8, 1.1, 2);
    const frontInner = randomFloat(0.7, 0.9, 2);
    const frontOuter = randomFloat(0.8, 1.0, 2);
    
    // Is it a race session?
    const isRace = sessionType.includes('Final') || sessionType.includes('Heat');
    
    // Random session date within the year
    const sessionDate = randomDateInRange(startDate, endDate);
    
    return {
      id: `session-${index + 1}`,
      userId,
      date: sessionDate,
      circuitId: track.id,
      temp,
      weatherCode,
      session: sessionType,
      tyreId: tyre.id,
      engineId: engine.id,
      chassisId: chassis[randomInt(0, chassis.length - 1)].id, // Random chassis
      rearSprocket,
      frontSprocket,
      caster,
      rideHeight,
      jet,
      rearInner,
      rearOuter,
      frontInner,
      frontOuter,
      laps,
      fastest,
      isRace,
      notes: note,
      createdAt: sessionDate
    };
  });
};

/**
 * Generate all sample data sets together
 * This ensures proper referential integrity between entities
 */
export const generateAllSampleData = (userId = 'test-user-1') => {
  const tyres = generateSampleTyres(userId);
  const engines = generateSampleEngines(userId);
  const chassis = generateSampleChassis(userId);
  const tracks = generateSampleTracks(userId);
  
  // Generate sessions last to ensure they can reference other entities
  const sessions = generateSampleSessions(userId);
  
  return {
    tyres,
    engines,
    chassis,
    tracks,
    sessions
  };
};

/**
 * Alias for backwards compatibility with main.js
 */
export const generateCompleteTestData = generateAllSampleData;