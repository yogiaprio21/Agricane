export const IRRIGATION_RULES = {
  MOISTURE: {
    CRITICAL: 35, // Below this: IMMEDIATE_IRRIGATION
    WARNING: 50,  // Below this: SCHEDULE_24H
    EXCESS: 75,   // Above this: REDUCE_IRRIGATION
  },
  CONFIDENCE: {
    HIGH: 0.95,
    MEDIUM_HIGH: 0.90,
    MEDIUM: 0.88,
    LOW: 0.82,
  },
};

export const HARVEST_RULES = {
  AGE: {
    MIN_OPTIMAL: 350,
    MAX_OPTIMAL: 420,
    TOO_EARLY_THRESHOLD: 300,
    OPTIMAL_TARGET: 365,
  },
  DECISIONS: {
    TOO_EARLY: 'TOO_EARLY',
    MONITOR: 'MONITOR_CLOSELY',
    READY: 'READY_FOR_HARVEST',
    OVERDUE: 'OVERDUE_HARVEST',
  },
};

export const RISK_THRESHOLDS = {
  TEMPERATURE: {
    HIGH: 35,
  },
  RAINFALL: {
    EXCESS: 100,
  },
  SOIL_PH: {
    MIN: 5.5,
    MAX: 8.0,
  },
};

export const IOT_THRESHOLDS = {
  MOISTURE: {
    MIN: 30,
    MAX: 80,
  },
  PH: {
    MIN: 5.5,
    MAX: 8.0,
  },
  TEMPERATURE: {
    MIN: 18,
    MAX: 35,
  },
};

export const SIMULATION_RANGES = {
  MOISTURE: { BASE: 25, VARIANCE: 60 },
  PH: { BASE: 5.5, VARIANCE: 2.5 },
  TEMPERATURE: { BASE: 18, VARIANCE: 17 },
};
