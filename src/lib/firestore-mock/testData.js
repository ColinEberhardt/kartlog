// Test data generator for mock Firestore
// Use this to generate realistic test data for UI testing and automation

/**
 * Generate sample tyres data
 */
export const generateSampleTyres = (userId = 'test-user-1') => {
  return [
    {
      id: 'tyre-1',
      userId,
      name: 'Vega Red',
      make: 'Vega',
      type: 'Dry',
      description: 'Prime competition tyre for dry conditions',
      retired: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'tyre-2',
      userId,
      name: 'Vega Blue',
      make: 'Vega',
      type: 'Wet',
      description: 'Wet weather racing tyre',
      retired: false,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'tyre-3',
      userId,
      name: 'Bridgestone YDS',
      make: 'Bridgestone',
      type: 'Dry',
      description: 'Older set - retired',
      retired: true,
      createdAt: new Date('2023-06-10')
    }
  ];
};

/**
 * Generate sample engines data
 */
export const generateSampleEngines = (userId = 'test-user-1') => {
  return [
    {
      id: 'engine-1',
      userId,
      name: 'IAME X30',
      make: 'IAME',
      serialNumber: 'X30-12345',
      description: 'Primary race engine',
      retired: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'engine-2',
      userId,
      name: 'IAME X30 Practice',
      make: 'IAME',
      serialNumber: 'X30-67890',
      description: 'Practice engine',
      retired: false,
      createdAt: new Date('2023-08-15')
    }
  ];
};

/**
 * Generate sample chassis data
 */
export const generateSampleChassis = (userId = 'test-user-1') => {
  return [
    {
      id: 'chassis-1',
      userId,
      name: 'Tony Kart Racer 401S',
      make: 'Tony Kart',
      model: 'Racer 401S',
      serialNumber: 'TK-2024-001',
      description: 'Race chassis',
      retired: false,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'chassis-2',
      userId,
      name: 'CRG Road Rebel',
      make: 'CRG',
      model: 'Road Rebel',
      serialNumber: 'CRG-2023-042',
      description: 'Backup chassis',
      retired: false,
      createdAt: new Date('2023-05-20')
    }
  ];
};

/**
 * Generate sample tracks data
 */
export const generateSampleTracks = (userId = 'test-user-1') => {
  return [
    {
      id: 'track-1',
      userId,
      name: 'Buckmore Park',
      latitude: 51.3528,
      longitude: 0.4917,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'track-2',
      userId,
      name: 'Rye House',
      latitude: 51.7698,
      longitude: -0.0249,
      createdAt: new Date('2024-01-02')
    },
    {
      id: 'track-3',
      userId,
      name: 'Daytona Sandown Park',
      latitude: 51.3667,
      longitude: -0.4000,
      createdAt: new Date('2024-01-03')
    }
  ];
};

/**
 * Generate sample sessions data
 */
export const generateSampleSessions = (userId = 'test-user-1', trackId = 'track-1', tyreId = 'tyre-1', engineId = 'engine-1') => {
  return [
    {
      id: 'session-1',
      userId,
      date: new Date('2024-01-15'),
      circuitId: trackId,
      temp: 18,
      weatherCode: 0, // Clear
      session: 'Practice',
      tyreId,
      engineId,
      rearSprocket: 75,
      frontSprocket: 12,
      caster: '3.5',
      rideHeight: '5mm',
      jet: 125,
      rearInner: 0.8,
      rearOuter: 0.9,
      frontInner: 0.8,
      frontOuter: 0.9,
      laps: 15,
      fastest: 58.234,
      isRace: false,
      notes: 'Good pace, slight understeer in turn 3',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'session-2',
      userId,
      date: new Date('2024-01-15'),
      circuitId: trackId,
      temp: 19,
      weatherCode: 0,
      session: 'Qualifying',
      tyreId,
      engineId,
      rearSprocket: 75,
      frontSprocket: 12,
      caster: '3.5',
      rideHeight: '5mm',
      jet: 125,
      rearInner: 0.8,
      rearOuter: 0.9,
      frontInner: 0.8,
      frontOuter: 0.9,
      laps: 8,
      fastest: 57.892,
      isRace: false,
      notes: 'PB! Kart felt great',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'session-3',
      userId,
      date: new Date('2024-01-15'),
      circuitId: trackId,
      temp: 20,
      weatherCode: 0,
      session: 'Final',
      tyreId,
      engineId,
      rearSprocket: 75,
      frontSprocket: 12,
      caster: '3.5',
      rideHeight: '5mm',
      jet: 125,
      rearInner: 0.8,
      rearOuter: 0.9,
      frontInner: 0.8,
      frontOuter: 0.9,
      laps: 12,
      fastest: 58.103,
      isRace: true,
      entries: 24,
      startPos: 5,
      endPos: 3,
      penalties: null,
      notes: 'Great race! Made up 2 positions',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'session-4',
      userId,
      date: new Date('2024-02-10'),
      circuitId: trackId,
      temp: 12,
      weatherCode: 2, // Overcast
      session: 'Practice',
      tyreId,
      engineId,
      rearSprocket: 76,
      frontSprocket: 12,
      caster: '4.0',
      rideHeight: '5mm',
      jet: 128,
      rearInner: 0.85,
      rearOuter: 0.95,
      frontInner: 0.85,
      frontOuter: 0.95,
      laps: 18,
      fastest: 58.756,
      isRace: false,
      notes: 'Colder conditions, adjusted setup',
      createdAt: new Date('2024-02-10')
    }
  ];
};

/**
 * Generate complete test data set
 */
export const generateCompleteTestData = (userId = 'test-user-1') => {
  const tyres = generateSampleTyres(userId);
  const engines = generateSampleEngines(userId);
  const chassis = generateSampleChassis(userId);
  const tracks = generateSampleTracks(userId);
  const sessions = generateSampleSessions(userId, tracks[0].id, tyres[0].id, engines[0].id);

  return {
    tyres,
    engines,
    chassis,
    tracks,
    sessions
  };
};

/**
 * Generate random session
 */
export const generateRandomSession = (userId, trackId, tyreId, engineId) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days

  const sessionTypes = ['Practice', 'Qualifying', 'Heat', 'Final'];
  const isRace = Math.random() > 0.5;

  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date,
    circuitId: trackId,
    temp: 10 + Math.floor(Math.random() * 20), // 10-30°C
    weatherCode: Math.floor(Math.random() * 3), // 0-2
    session: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
    tyreId,
    engineId,
    rearSprocket: 74 + Math.floor(Math.random() * 4), // 74-77
    frontSprocket: 12,
    caster: ['3.0', '3.5', '4.0'][Math.floor(Math.random() * 3)],
    rideHeight: ['4mm', '5mm', '6mm'][Math.floor(Math.random() * 3)],
    jet: 122 + Math.floor(Math.random() * 8), // 122-129
    rearInner: 0.7 + Math.random() * 0.3, // 0.7-1.0
    rearOuter: 0.8 + Math.random() * 0.3,
    frontInner: 0.7 + Math.random() * 0.3,
    frontOuter: 0.8 + Math.random() * 0.3,
    laps: 8 + Math.floor(Math.random() * 12), // 8-20 laps
    fastest: 57 + Math.random() * 3, // 57-60 seconds
    isRace,
    entries: isRace ? 15 + Math.floor(Math.random() * 15) : null,
    startPos: isRace ? 1 + Math.floor(Math.random() * 20) : null,
    endPos: isRace ? 1 + Math.floor(Math.random() * 20) : null,
    penalties: null,
    notes: ['Good session', 'Needs setup work', 'PB!', 'Difficult conditions'][Math.floor(Math.random() * 4)],
    createdAt: date
  };
};
